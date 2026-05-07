const HomepageNoticeBanner = () => {
  return (
    <div className="fixed right-3 bottom-20 z-50 lg:right-6 lg:top-1/2 lg:bottom-auto lg:-translate-y-1/2">
      <div className="w-[220px] lg:w-[260px] rounded-2xl p-3 lg:p-4 bg-white/40 backdrop-blur-md border border-white/20 shadow-sm">
        
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
