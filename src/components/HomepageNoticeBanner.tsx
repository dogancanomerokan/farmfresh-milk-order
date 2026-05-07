const HomepageNoticeBanner = () => {
  return (
    <div className="hidden lg:block fixed right-6 top-1/2 -translate-y-1/2 z-50">
      <div className="w-[260px] rounded-2xl p-4 bg-white/40 backdrop-blur-md border border-white/20 shadow-sm">
        
        {/* DUYURU */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
            Duyuru
          </p>
          <p className="text-sm text-foreground">
            Pazar teslimatları sınırlı kapasitededir.
          </p>
        </div>

        {/* AYLIK KAMPANYA */}
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
  );
};

export default HomepageNoticeBanner;
