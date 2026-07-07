// A minimal, dependency-free circuit breaker for guarding a slow or flaky
// external dependency (e.g. Cloudinary). It gives an outbound call three
// protections that a bare `await someSdk()` lacks:
//
//   1. TIMEOUT     — a hung dependency can't hold a request open forever; the
//                    call is rejected after `timeout` ms.
//   2. CONCURRENCY — at most `maxConcurrent` calls run at once, so a slow
//                    dependency can't let requests pile up and exhaust the
//                    event loop / socket pool. Excess calls fast-fail.
//   3. TRIPPING    — after `failureThreshold` consecutive failures (a rejected
//                    call OR a timeout) the breaker OPENS: every call fast-fails
//                    for `resetTimeout` ms instead of hitting the dead service.
//                    It then goes HALF-OPEN and lets a single trial call probe
//                    recovery — one success CLOSES it, one failure re-OPENS it.
//
// Net effect: when the dependency degrades, calls to it fail fast with a clear
// error instead of hanging, so unrelated endpoints stay responsive; when it
// recovers, the half-open probe lets traffic resume automatically. A single
// success in the closed state resets the failure count (consecutive-failure
// counting), which is simple and predictable.

export class CircuitOpenError extends Error {
  constructor(name) {
    super(`${name} is temporarily unavailable (circuit open)`);
    this.name = 'CircuitOpenError';
    this.code = 'CIRCUIT_OPEN';
  }
}

export class DependencyBusyError extends Error {
  constructor(name) {
    super(`${name} is at capacity`);
    this.name = 'DependencyBusyError';
    this.code = 'DEP_BUSY';
  }
}

export class DependencyTimeoutError extends Error {
  constructor(name, ms) {
    super(`${name} timed out after ${ms}ms`);
    this.name = 'DependencyTimeoutError';
    this.code = 'DEP_TIMEOUT';
  }
}

const now = () => Date.now();

export class CircuitBreaker {
  constructor({
    name = 'dependency',
    timeout = 10000,
    failureThreshold = 5,
    resetTimeout = 30000,
    maxConcurrent = 20,
  } = {}) {
    this.name = name;
    this.timeout = timeout;
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.maxConcurrent = maxConcurrent;

    this.state = 'closed'; // 'closed' | 'open' | 'half-open'
    this.failures = 0;
    this.nextTry = 0; // epoch ms at which an open circuit may probe again
    this.active = 0; // in-flight calls
  }

  // Snapshot for logging / health checks.
  get status() {
    return { name: this.name, state: this.state, failures: this.failures, active: this.active };
  }

  _trip() {
    this.state = 'open';
    this.nextTry = now() + this.resetTimeout;
  }

  _onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  _onFailure() {
    this.failures += 1;
    // A failed probe (half-open) re-opens immediately; otherwise trip once the
    // consecutive-failure threshold is reached.
    if (this.state === 'half-open' || this.failures >= this.failureThreshold) {
      this._trip();
    }
  }

  /**
   * Run `fn` (a function returning a promise) through the breaker.
   * Rejects immediately with CircuitOpenError when open, DependencyBusyError
   * when over the concurrency cap, or DependencyTimeoutError when `fn` runs
   * past `timeout`. Otherwise resolves/rejects with `fn`'s result.
   */
  async fire(fn) {
    // Cooldown elapsed on an open circuit → allow a single half-open trial.
    if (this.state === 'open' && now() >= this.nextTry) this.state = 'half-open';
    if (this.state === 'open') throw new CircuitOpenError(this.name);

    // In half-open, permit exactly one probe; otherwise enforce the cap.
    const limit = this.state === 'half-open' ? 1 : this.maxConcurrent;
    if (this.active >= limit) throw new DependencyBusyError(this.name);

    this.active += 1;
    try {
      const result = await this._withTimeout(fn);
      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure();
      throw err;
    } finally {
      this.active -= 1;
    }
  }

  _withTimeout(fn) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const done = (fnDone, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        fnDone(value);
      };
      const timer = setTimeout(
        () => done(reject, new DependencyTimeoutError(this.name, this.timeout)),
        this.timeout,
      );
      Promise.resolve()
        .then(fn)
        .then((v) => done(resolve, v), (e) => done(reject, e));
    });
  }
}
