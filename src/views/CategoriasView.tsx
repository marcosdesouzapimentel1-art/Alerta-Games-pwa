import React from 'react';
import { mockCategories, mockNews, mockDeals } from '../data/mockData';
import { CardNoticia } from '../components/CardNoticia';
import { CardPromocao } from '../components/CardPromocao';
import { EmptyState } from '../components/EmptyState';
import { Gamepad2, Box, Tv, Monitor, Tag, Rocket, Cpu, Trophy, Smartphone, Sparkles } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const CategoriasView: React.FC = () => {
  const { selectedCategory, setSelectedCategory } = useApp();

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Gamepad2': return <Gamepad2 className="w-5 h-5" />;
      case 'Box': return <Box className="w-5 h-5" />;
      case 'Tv': return <Tv className="w-5 h-5" />;
      case 'Monitor': return <Monitor className="w-5 h-5" />;
      case 'Tag': return <Tag className="w-5 h-5" />;
      case 'Rocket': return <Rocket className="w-5 h-5" />;
      case 'Cpu': return <Cpu className="w-5 h-5" />;
      case 'Trophy': return <Trophy className="w-5 h-5" />;
      case 'Smartphone': return <Smartphone className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const currentCategoryObj = mockCategories.find((c) => c.name === selectedCategory || c.id === selectedCategory) || mockCategories[0];
  const activeCategoryName = currentCategoryObj.name;

  // Filter items
  const isAll = activeCategoryName === 'Todas';
  const isDealsCategory = activeCategoryName.includes('Ofertas');

  const filteredNews = isAll
    ? mockNews
    : mockNews.filter((n) => n.category.toLowerCase().includes(activeCategoryName.toLowerCase()) || activeCategoryName.toLowerCase().includes(n.category.toLowerCase()));

  const filteredDeals = isDealsCategory
    ? mockDeals
    : mockDeals.filter((d) => d.platforms.some((p) => activeCategoryName.toLowerCase().includes(p.toLowerCase())));

  return (
    <div className="space-y-6 pb-20">
      
      {/* Category Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-100">
          Categorias Gamer
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Navegue por plataforma, hardware ou acompanhe promoções e lançamentos
        </p>
      </div>

      {/* Category Grid Pills */}
      <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-5 gap-3">
        {mockCategories.map((cat) => {
          const isSelected = activeCategoryName === cat.name || (isAll && cat.id === 'todas');
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name === 'Todas' ? null : cat.name)}
              className={`p-3.5 rounded-2xl border transition-all duration-200 text-left flex flex-col justify-between gap-3 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl ${isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-400'}`}>
                  {getCategoryIcon(cat.icon)}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400">
                  {cat.count}
                </span>
              </div>

              <span className="font-bold text-xs sm:text-sm font-heading line-clamp-1">
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content Section */}
      <div className="pt-4 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-xl font-bold font-heading text-slate-100">
            Conteúdos de <span className="text-cyan-400">{activeCategoryName}</span>
          </h2>
          <span className="text-xs text-slate-400">
            {filteredNews.length + (isDealsCategory ? filteredDeals.length : 0)} itens encontrados
          </span>
        </div>

        {/* If Deals category is selected */}
        {isDealsCategory && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Ofertas em Destaque</h3>
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredDeals.map((deal) => (
                <CardPromocao key={deal.id} deal={deal} />
              ))}
            </div>
          </div>
        )}

        {/* News Grid */}
        {filteredNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNews.map((news) => (
              <CardNoticia key={news.id} news={news} />
            ))}
          </div>
        ) : !isDealsCategory && (
          <EmptyState
            title="Nenhum artigo nesta categoria"
            description="Não encontramos artigos recentes para esta categoria no momento."
            actionText="Ver Todas as Categorias"
            onAction={() => setSelectedCategory(null)}
          />
        )}
      </div>

    </div>
  );
};
