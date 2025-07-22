import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Account = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [mobileNo, setMobileNo] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSignIn = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords don't match!");
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/signup', {
                name,
                mobileNo,
                email,
                password,
            });
            setSuccess('Sign Up successful! You can now log in.');
            setError('');
            setName('');
            setMobileNo('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data?.message || 'Error signing up. Please try again.');
            setSuccess('');
        }
    };

    const handleLogIn = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/login', {
                email,
                password,
            });

            localStorage.setItem('user_id', response.data.user_id);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('username' ,response.data.name);
            localStorage.setItem('is_admin', response.data.is_admin);

            setSuccess('Log In successful!');
            setError('');

            if (response.data.is_admin) {
                navigate('/admin-dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError('Error logging in. Please check your credentials.');
            setSuccess('');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 rounded-xl shadow-lg bg-gradient-to-br from-white to-gray-100 font-sans transition-all flex flex-col justify-center content-center">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                {isLogin ? 'Log In' : 'Sign Up'}
            </h2>
            <form onSubmit={isLogin ? handleLogIn : handleSignIn} className="flex flex-col space-y-6 justify-center content-center ">
                {!isLogin && (
                    <>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Name"
                            required
                            className="p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
                        />  
                        <input
                            type="tel"
                            value={mobileNo}
                            onChange={(e) => setMobileNo(e.target.value)}
                            placeholder="Mobile No"
                            required
                            className="p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
                        />
                    </>
                )}
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    className="p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className="p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
                />
                {!isLogin && (
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        required
                        className="p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
                    />
                )}
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white py-1 rounded-md text-lg transition duration-300 w-"
                >
                    {isLogin ? 'Log In' : 'Sign Up'}
                </button>

                <p className="text-center text-sm text-gray-600">
                    {isLogin ? 'Don\'t have an account?' : 'Already have an account?'}
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-blue-600 ml-1 underline"
                    >
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </p>
                {error && <p className="bg-red-100 text-red-600 text-center p-2 rounded-md">{error}</p>}
                {success && <p className="bg-green-100 text-green-700 text-center p-2 rounded-md">{success}</p>}
            </form>
        </div>
    );
};

export default Account;
