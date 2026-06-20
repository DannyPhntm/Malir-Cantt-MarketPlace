import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import authApi from '../services/authApi';
import { setAuthToken, clearAuthToken, getAuthToken } from '../services/apiClient';

const AuthContext = createContext(null);

// Session is backed by a JWT (Phase 5.2.4): the token is persisted by apiClient
// and the user record is re-fetched from /auth/me on load.

function formatJoinDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

// Maps an API user object → the `profile` shape the rest of the app consumes
// (ProfilePage, DashboardPage, AddListingPage). Kept backward-compatible so no
// other component needs changing.
function toProfile(user) {
  if (!user) {
    return {
      id: null,
      name: '',
      email: '',
      phone: '',
      area: '',
      canttPass: '',
      avatar: '',
      joinDate: '',
      isVerified: false,
      emailVerified: false,
      badgeType: 'resident',
      businessName: null,
      businessRequest: null,
    };
  }
  const isBusiness = user.accountType === 'business';
  return {
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    area: user.residentLocation || '',
    canttPass: user.canttPassNumber || '',
    avatar: user.avatarUrl || '',
    joinDate: formatJoinDate(user.createdAt),
    emailVerified: !!user.emailVerified,
    // Resident verification isn't a backend concept yet; treat a cantt pass as
    // the resident trust signal, business approval as the business one.
    isVerified: isBusiness ? !!user.businessVerified : !!user.canttPassNumber,
    badgeType: isBusiness ? 'business' : 'resident',
    businessName: user.businessAccount?.businessName || null,
    businessRequest: user.businessAccount || null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate the session on mount from the stored JWT.
  useEffect(() => {
    if (!getAuthToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: settles loading when there's no session to rehydrate
      setLoading(false);
      return;
    }
    let active = true;
    authApi
      .me()
      .then((res) => {
        if (active) setUser(res.user);
      })
      .catch((err) => {
        // Invalid/expired token (4xx) → drop it. Transient network error keeps it.
        if (err?.status >= 400 && err?.status < 500) clearAuthToken();
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Establish a session: store the JWT (if given) and the user record.
  const setSession = useCallback((u, token) => {
    if (token) setAuthToken(token);
    setUser(u);
  }, []);

  // ── Auth actions (throw ApiError on failure for the UI to display) ──────────
  const login = useCallback(
    async (email, password) => {
      const res = await authApi.login(email, password);
      setSession(res.user, res.token);
      return res.user;
    },
    [setSession],
  );

  const register = useCallback((payload) => authApi.register(payload), []);

  const verifyEmail = useCallback(
    async (email, code) => {
      const res = await authApi.verifyEmail(email, code);
      // Email verified → user is authenticated (token issued).
      setSession(res.user, res.token);
      return res.user;
    },
    [setSession],
  );

  const resendVerification = useCallback((email) => authApi.resendVerification(email), []);

  const requestPasswordReset = useCallback((email) => authApi.requestPasswordReset(email), []);

  const resetPassword = useCallback(
    (email, code, password) => authApi.resetPassword(email, code, password),
    [],
  );

  // Email change — request a code to the new address, then confirm it.
  const requestEmailChange = useCallback((newEmail) => authApi.requestEmailChange(newEmail), []);

  const confirmEmailChange = useCallback(async (newEmail, code) => {
    const res = await authApi.confirmEmailChange(newEmail, code);
    if (res?.user) setUser((prev) => ({ ...prev, ...res.user }));
    return res?.user;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearAuthToken();
  }, []);

  // Change password while signed in (requires the current password).
  const changePassword = useCallback(
    (currentPassword, newPassword) => authApi.changePassword(currentPassword, newPassword),
    [],
  );

  // updateProfile keeps the same call signature ProfilePage uses (profile-shaped
  // changes). Maps to the API's user fields and persists via PATCH /users/:id.
  const updateProfile = useCallback(
    async (changes = {}) => {
      if (!user) return;
      const payload = {};
      if (changes.name !== undefined) payload.name = changes.name;
      if (changes.phone !== undefined) payload.phone = changes.phone;
      if (changes.area !== undefined) payload.residentLocation = changes.area;
      if (changes.canttPass !== undefined) payload.canttPassNumber = changes.canttPass || null;
      // avatar: data-URL string to set, or null to remove the photo.
      if (changes.avatar !== undefined) payload.avatarUrl = changes.avatar || null;
      if (Object.keys(payload).length === 0) return;
      const res = await authApi.updateUser(user.id, payload);
      setUser((prev) => ({ ...prev, ...res.user }));
    },
    [user],
  );

  // Kept for API compatibility. The signup flow now creates the business account
  // at register time; a dedicated in-app "apply for business" screen (hitting
  // POST /api/business-accounts) will own this in a later phase.
  const applyForBusiness = useCallback(({ businessName } = {}) => {
    setUser((prev) =>
      prev
        ? {
            ...prev,
            accountType: 'business',
            businessAccount: { businessName, approved: false, paymentStatus: 'not_required' },
          }
        : prev,
    );
  }, []);

  const profile = toProfile(user);
  const userType = user?.accountType || 'personal';
  const businessRequest = user?.businessAccount || null;
  const businessStatus = businessRequest
    ? businessRequest.approved
      ? 'approved'
      : 'pending'
    : 'none';
  const isApprovedBusiness = !!user?.businessVerified;

  return (
    <AuthContext.Provider
      value={{
        // session
        isAuthenticated: !!user,
        loading,
        user,
        // actions
        login,
        register,
        verifyEmail,
        resendVerification,
        requestPasswordReset,
        resetPassword,
        requestEmailChange,
        confirmEmailChange,
        changePassword,
        logout,
        updateProfile,
        applyForBusiness,
        // derived profile (backward-compatible shape)
        profile,
        userType,
        businessRequest,
        businessStatus,
        isApprovedBusiness,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook is intentionally co-located with its provider; splitting would touch every consumer
export function useAuth() {
  return useContext(AuthContext);
}
