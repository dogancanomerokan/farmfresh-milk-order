import { useEffect, useState } from "react";

const HomepageNoticeBanner = () => {
  const [hideBanner, setHideBanner] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    const footer = document.querySelector("footer");
    if (!footer) return;

    const footerTop = footer.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;

    if (window.innerWidth < 1024) {
  setHideBanner(footerTop < windowHeight + 80);
} else {
  setHideBanner(false);
}
  };

  handleScroll();
  window.addEventListener("scroll", handleScroll);
  window.addEventListener("resize", handleScroll);

  return () => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("resize", handleScroll);
  };
}, []);

if (hideBanner) return null;
  return (
    <>
      {/* Mobil */}
     <div className="block lg:hidden fixed left-4 right-4 top-[70vh] z-50 [@media(orientation:landscape)]:hidden">
  <div className="rounded-2xl border border-white/20 bg-background/50 backdrop-blur-md shadow-md p-3">
    <div className="flex items-start gap-3">
      <span className="text-lg">🥛</span>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Bu Ay
        </p>
        <p className="text-sm font-medium text-foreground">
          20 litre alana 2 litre hediye
        </p>
        <p className="text-xs text-muted-foreground">
          Detaylar üye panelinde
        </p>
      </div>
    </div>
  </div>
</div>

      {/* Desktop */}
      <div className="hidden lg:block fixed right-6 top-1/2 -translate-y-1/2 z-50">
        <div className="w-[260px] rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/20 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
              Duyuru
            </p>
            <p className="text-sm text-foreground">
              Pazar teslimatları sınırlı kapasitededir.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
              Bu Ay
            </p>
            <p className="text-sm font-medium text-foreground">
              20 litre alana 2 litre hediye 🥛
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Detaylar üye panelinde
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomepageNoticeBanner;
