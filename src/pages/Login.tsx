import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FaGoogle, FaFacebookF, FaTwitter, FaGithub } from 'react-icons/fa';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Implement actual login logic here
      console.log('Login attempt:', data);
      // Simulate successful login
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
  {/* Left Side Illustration Panel */}
  <div className="w-1/2 bg-gradient-to-b from-[#9168f0] to-[#31275e] flex items-center justify-center overflow-hidden">
    <img
      src="/cover.png" // Replace with your actual space illustration path
      alt="space"
      className="w-4/6 max-h-[90%] object-cover mt-24"
    />
  </div>

  {/* Right Login Panel */}
  <div className="w-1/2 bg-white flex flex-col justify-center items-center px-8 overflow-hidden">
    {/* Logo Section */}
    <div className="flex flex-col items-center mb-8">
      <img src="/logo.svg" alt="logo" className="w-14 h-14 mb-2" />
      <h1 className="text-3xl font-bold text-gray-900">PrepWise</h1>
      <p className="text-sm text-gray-500">welcome to the website</p>
    </div>

    {/* Login Form */}
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-sm space-y-4"
    >
      {/* Username Field */}
      <div className="flex items-center bg-gradient-to-r from-purple-300 to-gray-400 rounded-full px-4 py-2">
        <i className="fas fa-user text-white mr-2" />
        <input
          type="text"
          placeholder="Username"
          className="bg-transparent text-white placeholder-white w-full focus:outline-none"
          {...register("email")}
        />
      </div>
      {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}

      {/* Password Field */}
      <div className="flex items-center bg-gradient-to-r from-purple-300 to-gray-400 rounded-full px-4 py-2">
        <i className="fas fa-lock text-white mr-2" />
        <input
          type="password"
          placeholder="Password"
          className="bg-transparent text-white placeholder-white w-full focus:outline-none"
          {...register("password")}
        />
      </div>
      {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}

      {/* Remember & Forgot Password */}
      <div className="flex justify-between text-sm text-gray-600">
        <label className="flex items-center">
          <input type="checkbox" className="mr-1" />
          Remember
        </label>
        <span className="hover:underline cursor-pointer">Forget Password ?</span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-900 hover:from-purple-600 hover:to-indigo-800 text-white rounded-full font-semibold"
      >
        {isLoading ? "Signing in..." : "LOGIN"}
      </button>
    </form>
  </div>
</div>

  
  );
}
