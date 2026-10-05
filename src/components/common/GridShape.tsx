export default function GridShape() {
  const gridSrc = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/images/shape/grid-01.svg`;

  return (
    <div className="pointer-events-none select-none" aria-hidden="true">
      <div className="absolute right-0 top-0 -z-1 w-full max-w-[250px] xl:max-w-[450px] opacity-60">
        <img src={gridSrc} alt="" role="presentation" className="w-full h-auto" />
      </div>
      <div className="absolute bottom-0 left-0 -z-1 w-full max-w-[250px] rotate-180 xl:max-w-[450px] opacity-60">
        <img src={gridSrc} alt="" role="presentation" className="w-full h-auto" />
      </div>
    </div>
  );
}
