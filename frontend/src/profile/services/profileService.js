import api from '@/services/api';

export const profileService = {
    // ambil profil
    getProfile: () => api.get('/me'),

    // update data (TANPA foto)
    updateProfile: (data) => api.put('/profile', data),

    // update foto
    updatePhoto: (formData) =>
        api.post('/profile/photo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }),
    deletePhoto: () => api.delete('/profile/photo'),

    updatePassword: (data) => api.put('/profile/password', data),

    deleteAccount: (data) => api.delete('/profile', { data }),
};