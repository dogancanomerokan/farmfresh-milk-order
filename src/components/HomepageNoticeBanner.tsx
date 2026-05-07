const HomepageNoticeBanner = () => {
  return (
    <>
      {/* Mobil */}
      <div className="block lg:hidden fixed right-4 left-4 bottom-[0.50rem] z-50 [@media(orientation:landscape)]:hidden">
  <div className="rounded-2xl border border-white/20 bg-background/75 backdrop-blur-md shadow-md p-3">
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
