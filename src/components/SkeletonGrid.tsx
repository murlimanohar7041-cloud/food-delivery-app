export default function SkeletonGrid() {
  return (
    <section className="py-10 bg-gray-50 dark:bg-[#0a0a0a] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-8 w-64 skeleton mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card rounded-[16px] overflow-hidden border border-gray-200 dark:border-white/5">
              <div className="h-[200px] skeleton"></div>
              <div className="p-5">
                <div className="h-6 w-3/4 skeleton mb-4"></div>
                <div className="h-4 w-1/2 skeleton mb-4"></div>
                <div className="h-4 w-full skeleton mb-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
