export default function GoogleButton({ label }) {
  const handleGoogleSignIn = () => {
    window.location.href = `${
      import.meta.env.VITE_BACKEND_URL
    }/auth/google/login`;
  };
  return (
    <button
      type="button"
      className="w-full mt-4 bg-white text-black hover:bg-gray-100 py-2 rounded font-semibold flex items-center justify-center gap-2 text-sm"
      onClick={handleGoogleSignIn}
    >
      <img
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        alt="Google"
        className="w-5 h-5"
      />
      {label}
    </button>
  );
}
// This component renders a Google sign-in button with a label.
