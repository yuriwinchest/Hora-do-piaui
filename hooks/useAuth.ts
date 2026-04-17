
import { useAuthContext } from '../contexts/AuthContext';

export type { Profile } from '../contexts/AuthContext';

export function useAuth() {
    const { user, profile, loading, signOut } = useAuthContext();
    return { user, profile, loading, signOut };
}
