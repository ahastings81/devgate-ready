// frontend/src/pages/Profile.tsx
import React, { useEffect, useState } from 'react';
import placeholderAvatar from '../assets/avatar-placeholder.png';

interface UserProfile {
  id: number;
  email: string;
  profilePic: string | null;
}

const API = import.meta.env.VITE_API_URL; // e.g. http://localhost:4000

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/users/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('devgate_token')}` }
    })
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setProfile)
      .catch(err => {
        console.error(err);
        setError('Failed to load profile.');
      });
  }, []);

  if (error) return <p>{error}</p>;
  if (!profile) return <p>Loading profile…</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Your Profile</h1>
      <div className="flex items-center space-x-4">
        <img
          src={
            profile.profilePic
              ? `${API}${profile.profilePic}`
              : placeholderAvatar
          }
          alt="Avatar"
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
        <div>
          <p><strong>Email:</strong> {profile.email}</p>
          {/* add more fields here as needed */}
        </div>
      </div>
      <form
        className="mt-6"
        onSubmit={async e => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem('avatar') as HTMLInputElement;
          if (!input.files?.[0]) return;
          const formData = new FormData();
          formData.append('avatar', input.files[0]);
          const res = await fetch(`${API}/users/avatar`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('devgate_token')}`
            },
            body: formData
          });
          if (res.ok) {
            const updated = await res.json();
            setProfile(updated);
          } else {
            alert('Upload failed');
          }
        }}
      >
        <label className="block mb-2">
          Change Avatar:
          <input type="file" name="avatar" accept="image/*" className="ml-2" />
        </label>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Upload
        </button>
      </form>
    </div>
  );
};

export default Profile;
