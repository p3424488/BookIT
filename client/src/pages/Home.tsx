import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEvents, getFilters, searchEvents } from '../api/events';
import EventCard from '../components/EventCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getRecommendations } from '../api/events';
import { useAuthStore } from '../store/authStore';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { isLoggedIn } = useAuthStore();
  // Fetch filtered events
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['events', selectedCity, selectedCategory],
    queryFn: () => getEvents({
      city: selectedCity || undefined,
      category: selectedCategory || undefined,
    }),
    staleTime: 0,
  });

  const { data: recommendationsData } = useQuery({
  queryKey: ['recommendations'],
  queryFn: getRecommendations,
  enabled: isLoggedIn,
});

  // Fetch filters
  const { data: filtersData } = useQuery({
    queryKey: ['filters'],
    queryFn: getFilters,
  });

  // Search results — only when searchQuery > 2 chars
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => searchEvents({ q: searchQuery }),
    enabled: searchQuery.length > 2,
    staleTime: 0,
  });

  // Decide what to show
  const isSearchMode = searchQuery.length > 2;
  const displayEvents = isSearchMode ? searchData?.events : eventsData?.events;
  const isLoading = isSearchMode ? searchLoading : eventsLoading;
  const featuredEvents = eventsData?.events?.slice(0, 3) || [];

  const handleCategoryClick = (cat: string) => {
    setSearchQuery(''); // clear search when filtering
    setSelectedCategory(selectedCategory === cat ? '' : cat);
  };

  const handleCityClick = (city: string) => {
    setSearchQuery(''); // clear search when filtering
    setSelectedCity(selectedCity === city ? '' : city);
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setSelectedCity('');
    setSelectedCategory('');
  };

  

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh' }}>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ minHeight: '260px', display: 'flex', alignItems: 'center' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1a0a2e, #0d1b3e, #0a0a0f)' }} />
        <div className="absolute" style={{ top: '-80px', left: '-80px', width: '350px', height: '350px', background: 'rgba(226,75,74,0.12)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div className="absolute" style={{ bottom: '-60px', right: '-60px', width: '280px', height: '280px', background: 'rgba(83,74,183,0.12)', borderRadius: '50%', filter: 'blur(80px)' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10 w-full">
          <div className="max-w-lg">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs mb-4"
              style={{ background: 'rgba(226,75,74,0.15)', border: '1px solid rgba(226,75,74,0.3)', color: '#E24B4A' }}
            >
              ✦ AI-powered recommendations
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
              Book Your Next<br />Experience
            </h1>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Movies, Concerts, Sports & more — all in one place
            </p>

            {/* Search */}
            <div
              className="flex gap-2 p-1.5 pl-4"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
            >
              <input
                type="text"
                placeholder="Search events, venues, cities..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) {
                    setSelectedCity('');
                    setSelectedCategory('');
                  }
                }}
                className="flex-1 bg-transparent border-none outline-none text-sm"
                style={{ color: '#fff' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs px-2"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  ✕
                </button>
              )}
              <button className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium">
                Search
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-4 mt-5">
              {[['500+', 'Events'], ['50+', 'Cities'], ['1M+', 'Bookings']].map(([num, label]) => (
                <div
                  key={label}
                  className="flex-1 text-center py-2 px-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="text-base font-bold text-white">{num}</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="sticky z-40"
        style={{ top: '56px', background: 'rgba(10,10,15,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          {/* All button */}
          <button
            onClick={handleClearAll}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all"
            style={!selectedCity && !selectedCategory && !searchQuery
              ? { background: '#E24B4A', color: '#fff', border: '1px solid #E24B4A' }
              : { background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
            }
          >
            All
          </button>

          {/* Category chips */}
          {filtersData?.categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={selectedCategory === cat
                ? { background: '#E24B4A', color: '#fff', border: '1px solid #E24B4A' }
                : { background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
              }
            >
              {cat}
            </button>
          ))}

          <div className="w-px mx-1 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

          {/* City chips */}
          {filtersData?.cities.map((city) => (
            <button
              key={city}
              onClick={() => handleCityClick(city)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={selectedCity === city
                ? { background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }
                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              📍 {city}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

      {/* Recommendations — only show when logged in */}
{isLoggedIn && recommendationsData?.recommendations && recommendationsData.recommendations.length > 0 && (
  <div className="mb-8">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-white">
          ✦ Recommended for you
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {recommendationsData.source === 'ml' ? 'Powered by AI' : 'Popular events'}
        </p>
      </div>
    </div>
    <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
      {recommendationsData.recommendations.map((event) => (
        <EventCard key={event.id} event={event} variant="featured" />
      ))}
    </div>
  </div>
)}

        {/* Featured — only show when no filters active */}
        {!isSearchMode && !selectedCategory && !selectedCity && featuredEvents.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Featured this week</h2>
              <button className="text-xs" style={{ color: '#E24B4A', background: 'none', border: 'none', cursor: 'pointer' }}>
                See all →
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} variant="featured" />
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        {!isSearchMode && !selectedCategory && !selectedCity && (
          <div className="mb-6" style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
        )}

        {/* Active filter indicator */}
        {(selectedCategory || selectedCity) && !isSearchMode && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Showing:
            </span>
            {selectedCategory && (
              <span
                className="text-xs px-3 py-1 rounded-full flex items-center gap-1"
                style={{ background: 'rgba(226,75,74,0.15)', border: '1px solid rgba(226,75,74,0.3)', color: '#E24B4A' }}
              >
                {selectedCategory}
                <button onClick={() => setSelectedCategory('')} className="ml-1">✕</button>
              </span>
            )}
            {selectedCity && (
              <span
                className="text-xs px-3 py-1 rounded-full flex items-center gap-1"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
              >
                📍 {selectedCity}
                <button onClick={() => setSelectedCity('')} className="ml-1">✕</button>
              </span>
            )}
          </div>
        )}

        {/* Events section header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">
            {isSearchMode
              ? `Results for "${searchQuery}"`
              : selectedCategory && selectedCity
              ? `${selectedCategory} in ${selectedCity}`
              : selectedCategory
              ? `${selectedCategory} events`
              : selectedCity
              ? `Events in ${selectedCity}`
              : 'Now showing'}
          </h2>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {displayEvents?.length || 0} events
          </span>
        </div>

        {/* Events grid */}
        {isLoading ? (
          <LoadingSpinner />
        ) : displayEvents && displayEvents.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {displayEvents.map((event) => (
              <EventCard key={event.id} event={event} variant="grid" />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🎭</p>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>
              No {selectedCategory || 'events'} found
              {selectedCity ? ` in ${selectedCity}` : ''}
            </p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Try a different filter
            </p>
            <button
              onClick={handleClearAll}
              className="mt-4 bg-primary text-white px-4 py-2 rounded-lg text-sm"
            >
              Show all events
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;