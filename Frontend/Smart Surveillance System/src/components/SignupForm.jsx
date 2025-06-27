import { useForm } from "react-hook-form";
import GoogleButton from "./GoogleButton";
import { Loader } from "lucide-react";
export default function SignupForm({
  onSubmit,
  errorMessage,
  toggleForm,
  loading,
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-black border border-orange-500 rounded-lg p-6 w-full max-w-md shadow-[0_0_10px_rgba(255,115,0,0.7)] sm:p-8"
    >
      <h2 className="text-white text-2xl font-semibold mb-6 text-center">
        Create Account
      </h2>

      <div className="mb-4">
        <label htmlFor="username" className="block text-gray-300 mb-1 text-sm">
          Username
        </label>
        <input
          id="username"
          type="text"
          {...register("username", { required: "Username is required" })}
          className="w-full px-3 py-2 rounded bg-gray-600 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
        />
        {errors.username && (
          <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="email" className="block text-gray-300 mb-1 text-sm">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: "Enter a valid email",
            },
          })}
          className="w-full px-3 py-2 rounded bg-gray-600 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="password" className="block text-gray-300 mb-1 text-sm">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register("password", { required: "Password is required" })}
          className="w-full px-3 py-2 rounded bg-gray-600 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
        />
        {errors.password && (
          <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="confirmPassword"
          className="block text-gray-300 mb-1 text-sm"
        >
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) => value === password || "Passwords do not match",
          })}
          className="w-full px-3 py-2 rounded bg-gray-600 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs mt-1">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>
      {Array.isArray(errorMessage) ? (
        errorMessage.map((err, idx) => (
          <p key={idx} className="text-red-500 text-xs mt-1">
            {err.msg}
          </p>
        ))
      ) : (
        <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
      )}

      <button
        type="submit"
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded font-semibold text-sm flex items-center justify-center"
        disabled={loading}
      >
        {loading ? <Loader className="w-5 h-5 animate-spin" /> : "Sign Up"}
      </button>

      <div className="text-sm text-gray-400 mt-4 text-center">or</div>

      <GoogleButton label="Continue with Google" />

      <div className="text-sm text-gray-400 mt-6 text-center">
        Already have an account?{" "}
        <button
          className="text-orange-400 hover:underline"
          onClick={toggleForm}
        >
          Login
        </button>
      </div>
    </form>
  );
}
