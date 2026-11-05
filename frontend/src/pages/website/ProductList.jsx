import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Store, Search, PackageSearch, X, IndianRupee, ArrowUpDown } from 'lucide-react';
import { fetchProducts, fetchActiveCategories } from '../../store/slices/website/catalogSlice';
import ProductCard from '../../components/website/common/ProductCard';
import PageHero from '../../components/website/common/PageHero';
import useSeo from '../../hooks/useSeo';
import useLiveContent from '../../hooks/useLiveContent';

const rupees = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

// Quick price ranges (on the selling price); '' means no bound on that side
const PRICE_RANGES = [
  { min: '', max: '500' },
  { min: '500', max: '2000' },
  { min: '2000', max: '10000' },
  { min: '10000', max: '30000' },
  { min: '30000', max: '' },
];
const rangeLabel = (min, max) => {
  if (min && max) return `${rupees(min)} – ${rupees(max)}`;
  if (max) return `Under ${rupees(max)}`;
  return `Above ${rupees(min)}`;
};

const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest first' },
];

// Keep only whole, non-negative amounts from the URL / inputs
const cleanAmount = (v) => (/^\d+$/.test(String(v ?? '').trim()) ? String(Number(v)) : '');

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { products, categories, productsLoading: loading } = useSelector((s) => s.catalog);
  const [search, setSearch] = useState('');

  const categoryId = searchParams.get('categoryId') || '';
  const minPrice = cleanAmount(searchParams.get('minPrice'));
  const maxPrice = cleanAmount(searchParams.get('maxPrice'));
  const sort = SORT_OPTIONS.some((o) => o.value === searchParams.get('sort')) ? searchParams.get('sort') : '';
  const hasPrice = Boolean(minPrice || maxPrice);

  // Custom min / max boxes: follow the URL when a preset or "clear" changes it
  const [minInput, setMinInput] = useState(minPrice);
  const [maxInput, setMaxInput] = useState(maxPrice);
  useEffect(() => { setMinInput(minPrice); setMaxInput(maxPrice); }, [minPrice, maxPrice]);
  const categoryName = categories.find((c) => String(c.category_id) === String(categoryId))?.name;
  useSeo({
    title: categoryName ? `${categoryName} - Shop online` : 'All products',
    description: categoryName
      ? `Buy ${categoryName} online at ShopEase. Great prices, secure checkout and fast delivery.`
      : 'Browse all products at ShopEase - electronics, fashion and home essentials with fast delivery.',
    path: categoryId ? `/products?categoryId=${categoryId}` : '/products',
  });

  const filters = { categoryId, minPrice, maxPrice, sort };
  const load = (term = search) => dispatch(fetchProducts({ ...filters, search: term }));

  useEffect(() => { load(); }, [categoryId, minPrice, maxPrice, sort]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { dispatch(fetchActiveCategories()); }, [dispatch]);

  // Admin edits show up live, without the loading skeletons
  useLiveContent(['products', 'categories', 'subcategories'], ({ type }) => {
    dispatch(fetchProducts({ ...filters, search, silent: true }));
    if (type === 'categories') dispatch(fetchActiveCategories({ silent: true }));
  });

  // Change some URL filters and keep the rest; empty values are dropped from the URL
  const updateParams = (changes) => {
    const next = { categoryId, minPrice, maxPrice, sort, ...changes };
    setSearchParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v)));
  };
  const pickCategory = (id) => updateParams({ categoryId: id });
  const pickRange = (r) => {
    const active = r.min === minPrice && r.max === maxPrice;
    updateParams(active ? { minPrice: '', maxPrice: '' } : { minPrice: r.min, maxPrice: r.max });
  };
  const applyCustomPrice = (e) => {
    e.preventDefault();
    let lo = cleanAmount(minInput);
    let hi = cleanAmount(maxInput);
    if (lo && hi && Number(lo) > Number(hi)) [lo, hi] = [hi, lo]; // typed the wrong way round
    updateParams({ minPrice: lo, maxPrice: hi });
  };
  const clearPrice = () => updateParams({ minPrice: '', maxPrice: '' });
  const clearSearch = () => { setSearch(''); load(''); };
  const clearAll = () => { setSearch(''); setSearchParams({}); if (!categoryId && !hasPrice && !sort) load(''); };

  const chipCls = (active) =>
    `shrink-0 animate-scaleIn rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
      active
        ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30'
        : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:-translate-y-0.5 hover:text-indigo-600 hover:ring-indigo-300'
    }`;

  return (
    <div>
      <PageHero
        theme="products" icon={Store}
        title={categoryName || 'All products'}
        subtitle={categoryName ? `Everything in ${categoryName}` : 'Electronics, fashion and home essentials'}
        crumbs={categoryName ? [{ label: 'Products', to: '/products' }, { label: categoryName }] : [{ label: 'Products' }]}
      >
        <form onSubmit={(e) => { e.preventDefault(); load(); }} role="search" className="flex max-w-xl gap-2">
          <div className="relative flex-1">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search" aria-label="Search products" placeholder="Search products..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border-0 bg-white py-3 pl-10 pr-10 text-sm text-gray-800 shadow-lg outline-none ring-4 ring-white/20 transition-shadow focus:ring-white/50"
            />
            {search && (
              <button type="button" onClick={clearSearch} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100">
                <X size={15} />
              </button>
            )}
          </div>
          <button className="rounded-full bg-white/20 px-5 text-sm font-semibold text-white ring-1 ring-white/40 backdrop-blur transition-colors hover:bg-white/30">
            Search
          </button>
        </form>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Category chips - scroll sideways on phones */}
        <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]" role="tablist" aria-label="Categories">
          <button role="tab" aria-selected={!categoryId} onClick={() => pickCategory('')} className={chipCls(!categoryId)}>All</button>
          {categories.map((c, i) => (
            <button
              key={c.category_id} role="tab" aria-selected={String(c.category_id) === categoryId}
              onClick={() => pickCategory(String(c.category_id))} className={chipCls(String(c.category_id) === categoryId)}
              style={{ animationDelay: `${(i + 1) * 50}ms` }}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Price filter + sort */}
        <div className="mb-6 animate-fadeInUp rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <span className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                <IndianRupee size={15} className="text-indigo-500" /> Price
              </span>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Price range">
                {PRICE_RANGES.map((r) => {
                  const active = r.min === minPrice && r.max === maxPrice;
                  return (
                    <button key={`${r.min}-${r.max}`} type="button" aria-pressed={active} onClick={() => pickRange(r)} className={chipCls(active)}>
                      {rangeLabel(r.min, r.max)}
                    </button>
                  );
                })}
              </div>
              <form onSubmit={applyCustomPrice} className="mt-3 flex flex-wrap items-center gap-2" aria-label="Custom price range">
                <input
                  type="number" inputMode="numeric" min="0" step="1" placeholder="₹ Min" aria-label="Minimum price"
                  value={minInput} onChange={(e) => setMinInput(e.target.value)}
                  className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 sm:w-28"
                />
                <span className="text-sm text-gray-400">to</span>
                <input
                  type="number" inputMode="numeric" min="0" step="1" placeholder="₹ Max" aria-label="Maximum price"
                  value={maxInput} onChange={(e) => setMaxInput(e.target.value)}
                  className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 sm:w-28"
                />
                <button className="rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 transition-transform hover:-translate-y-0.5">
                  Go
                </button>
                {hasPrice && (
                  <button type="button" onClick={clearPrice} className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-indigo-600">
                    <X size={14} /> Clear price
                  </button>
                )}
              </form>
            </div>

            <label className="flex shrink-0 items-center gap-2 text-sm font-semibold text-gray-700">
              <ArrowUpDown size={15} className="text-indigo-500" /> Sort by
              <select
                value={sort} onChange={(e) => updateParams({ sort: e.target.value })}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-normal text-gray-700 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          </div>
        </div>

        {!loading && (
          <p className="mb-4 animate-fadeIn text-sm text-gray-500">
            {products.length} product{products.length === 1 ? '' : 's'}
            {search ? <> for &ldquo;<span className="font-medium text-gray-700">{search}</span>&rdquo;</> : ''}
            {hasPrice ? <> · <span className="font-medium text-gray-700">{rangeLabel(minPrice, maxPrice)}</span></> : ''}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-shimmer rounded-xl bg-gradient-to-r from-gray-100 via-white to-gray-100 bg-[length:200%_100%]" />
            ))
            : products.map((p, i) => <ProductCard key={p.product_id} product={p} index={i} />)}
        </div>

        {!loading && products.length === 0 && (
          <div className="flex animate-scaleIn flex-col items-center py-16 text-center">
            <span className="flex h-20 w-20 animate-float items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 text-indigo-500">
              <PackageSearch size={36} />
            </span>
            <p className="mt-4 font-semibold text-gray-700">No products found</p>
            <p className="text-sm text-gray-500">Try another search, category or price range.</p>
            {(search || categoryId || hasPrice) && (
              <button onClick={clearAll} className="mt-4 text-sm font-medium text-indigo-600 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
