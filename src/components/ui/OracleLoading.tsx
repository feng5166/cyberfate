export function OracleLoading() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-[#FAF3EC] rounded-full text-sm text-[#1C1A16]/70 w-fit">
      <svg
        className="animate-spin w-4 h-4 text-[#C2762B]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        />
      </svg>
      <span>命理师正在解读...</span>
    </div>
  );
}
