import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Store, Search, PackageSearch, X } from 'lucide-react';
import { fetchProducts, fetchActiveCategories } from '../../store/slices/website/catalogSlice';
import ProductCard from '../../components/website/common/ProductCard';
import PageHero from '../../components/website/common/PageHero';
import useSeo from '../../hooks/useSeo';

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { products, categories, productsLoading: loading } = useSelector((s) => s.catalog);
  const [search, setSearch] = useState('');

  const categoryId = searchParams.get('categoryId') || '';
  const categoryName = categories.find((c) => String(c.id) === String(categoryId))?.name;
  useSeo({
    title: categoryName ? `${categoryName} - Shop online` : 'All products',
    description: categoryName
      ? `Buy ${categoryName} online at ShopEase. Great prices, secure checkout and fast delivery.`
      : 'Browse all products at ShopEase - electronics, fashion and home essentials with fast delivery.',
    path: categoryId ? `/products?categoryId=${categoryId}` : '/products',
  });

  const load = (term = search) => dispatch(fetchProducts({ categoryId, search: term }));

  useEffect(() => { load(); }, [categoryId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { dispatch(fetchActiveCategories()); }, [dispatch]);

  const pickCategory = (id) => setSearchParams(id ? { categoryId: id } : {});
  const clearSearch = () => { setSearch(''); load(''); };

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
              key={c.id} role="tab" aria-selected={String(c.id) === categoryId}
              onClick={() => pickCategory(String(c.id))} className={chipCls(String(c.id) === categoryId)}
              style={{ animationDelay: `${(i + 1) * 50}ms` }}
            >
              {c.name}
            </button>
          ))}
        </div>

        {!loading && (
          <p className="mb-4 animate-fadeIn text-sm text-gray-500">
            {products.length} product{products.length === 1 ? '' : 's'}{search ? <> for &ldquo;<span className="font-medium text-gray-700">{search}</span>&rdquo;</> : ''}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-shimmer rounded-xl bg-gradient-to-r from-gray-100 via-white to-gray-100 bg-[length:200%_100%]" />
            ))
            : products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>

        {!loading && products.length === 0 && (
          <div className="flex animate-scaleIn flex-col items-center py-16 text-center">
            <span className="flex h-20 w-20 animate-float items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 text-indigo-500">
              <PackageSearch size={36} />
            </span>
            <p className="mt-4 font-semibold text-gray-700">No products found</p>
            <p className="text-sm text-gray-500">Try another search or category.</p>
            {(search || categoryId) && (
              <button onClick={() => { setSearch(''); pickCategory(''); if (!categoryId) load(''); }} className="mt-4 text-sm font-medium text-indigo-600 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
