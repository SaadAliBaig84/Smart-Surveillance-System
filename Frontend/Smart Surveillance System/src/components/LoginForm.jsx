// Updated LoginForm.jsx using react-hook-form with email
import { useForm } from "react-hook-form";
import GoogleButton from "./GoogleButton";
import { Loader } from "lucide-react";
export default function LoginForm({
  onSubmit,
  errorMessage,
  toggleForm,
  loading,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-black border border-orange-500 rounded-lg p-6 w-full max-w-md shadow-[0_0_10px_rgba(255,115,0,0.7)] sm:p-8"
    >
      <h2 className="text-white text-2xl font-semibold mb-6 text-center">
        Login
      </h2>

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
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded mt-2 font-semibold text-sm flex items-center justify-center"
        disabled={loading}
      >
        {loading ? (
          <Loader className="w-5 h-5 animate-spin align-middle" />
        ) : (
          "Sign In"
        )}
      </button>

      <div className="text-sm text-gray-400 mt-4 text-center">or</div>

      <GoogleButton label="Continue with Google" />

      <div className="flex justify-between text-sm text-gray-400 mt-6">
        <button type="button" className="hover:text-orange-400">
          Forgot Password?
        </button>
        <div>
          Don't have an account?{" "}
          <button
            type="button"
            onClick={toggleForm}
            className="text-orange-400 hover:underline"
          >
            Sign up
          </button>
        </div>
      </div>
    </form>
  );
}
