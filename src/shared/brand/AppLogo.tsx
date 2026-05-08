import logoPaths from "./logo-paths";

export function AppLogo() {
  return (
    <div className="relative size-full">
      <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox="-160 -150 1400 1312.5">
        <path d={logoPaths.cartMark} fill="var(--fill-0, #007CFF)" />
      </svg>
    </div>
  );
}
