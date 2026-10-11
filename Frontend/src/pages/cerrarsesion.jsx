import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CerrarSesion() {
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/login', { replace: true });
    }, [navigate]);

    return null;
}