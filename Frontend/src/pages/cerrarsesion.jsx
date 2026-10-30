import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CerrarSesion() {
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('usuario');
        navigate('/login', { replace: true });
    }, [navigate]);

    return null;
}