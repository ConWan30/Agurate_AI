import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EnhancedAnalytics() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the unified predictions page
    navigate('/predictions', { replace: true });
  }, [navigate]);

  return null;
}
