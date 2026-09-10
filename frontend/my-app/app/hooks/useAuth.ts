/**
 * Hook tiện ích để truy cập Auth Context từ bất kỳ component nào.
 * 
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 */
export { useAuthContext as useAuth } from "../context/AuthContext";
