import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import GoogleLogin from "@/Components/GoogleLogin";
import { loginUser } from "../../Api/AuthApis";

const Login = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
        if (serverError) setServerError("");
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim()) newErrors.email = "Email is required";
        if (!formData.password.trim()) newErrors.password = "Password is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        setServerError("");

        try {
            const res = await loginUser(formData);
            if (res) navigate("/");
        } catch (error) {
            const msg = error.response?.data?.message || "Invalid credentials";
            setServerError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12">

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md space-y-8"
            >
                <div className="relative rounded-2xl border border-white/10 
                    bg-gradient-to-br from-white/10 via-white/5 to-transparent 
                    dark:from-white/5 dark:via-white/0 dark:to-transparent
                    p-8 shadow-[0_0_25px_rgba(255,255,255,0.08)]
                    backdrop-blur-2xl">

                    <div className="text-center">
                        <h2 className="mt-2 text-3xl font-bold tracking-tight text-white drop-shadow-lg">
                            Welcome Back
                        </h2>
                        <p className="mt-2 text-sm text-gray-300">
                            Login to Get The Premium
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {serverError && (
                            <div className="rounded-md bg-red-500/20 border border-red-500/30 
                                p-3 text-sm text-red-300 text-center animate-pulse">
                                {serverError}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-300" />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Email Address"
                                        className={`block w-full rounded-lg border 
                                            bg-white/10 backdrop-blur-xl text-white 
                                            placeholder-gray-300 p-3 pl-10
                                            focus:ring-2 focus:ring-indigo-400
                                            transition-all duration-200
                                            ${errors.email ? "border-red-400" : "border-white/20"}`}
                                    />
                                </div>
                                {errors.email && <p className="mt-1 text-xs text-red-400 pl-1">{errors.email}</p>}
                            </div>

                            <div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-300" />

                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Password"
                                        className={`block w-full rounded-lg border 
                                            bg-white/10 backdrop-blur-xl text-white 
                                            placeholder-gray-300 p-3 pl-10 pr-10
                                            focus:ring-2 focus:ring-indigo-400
                                            transition-all duration-200
                                            ${errors.password ? "border-red-400" : "border-white/20"}`}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-300"
                                    >
                                        {showPassword ? <EyeOff /> : <Eye />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1 text-xs text-red-400 pl-1">{errors.password}</p>}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="cursor-pointer group relative flex w-full justify-center rounded-lg 
                                bg-gradient-to-r from-blue-600 to-indigo-500
                                py-3 px-4 text-sm font-semibold text-white shadow-xl 
                                hover:transition-all duration-300
                                focus:ring-2 focus:ring-purple-400 disabled:opacity-60"
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Sign In"
                            )}
                        </button>

                        <div className="relative flex items-center w-full my-2">
                            <div className="flex-grow border-t border-white/20"></div>
                            <span className="mx-3 text-sm text-gray-300 select-none">OR</span>
                            <div className="flex-grow border-t border-white/20"></div>
                        </div>

                        <button className="cursor-pointer group relative flex w-full justify-center rounded-lg">
                            <GoogleLogin />
                        </button>

                        <div className="text-center text-sm text-gray-300">
                            Don’t have an account?{" "}
                            <Link to="/user/register" className="font-medium text-indigo-300 hover:text-indigo-200">
                                Register
                            </Link>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
