import { useNavigate } from 'react-router-dom';
import type { Event } from '../types/index';
import { formatDate, formatDuration, getCategoryColor } from '../utils/helpers';

interface EventCardProps {
  event: Event;
  variant?: 'grid' | 'featured';
}

const EVENT_IMAGES: { [key: string]: string } = {
  Movie: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80',
  Concert: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80',
  Sports: 'https://images.unsplash.com/photo-1540747913346-19212a4b423e?w=400&q=80',
  Theatre: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=400&q=80',
};

const getImage = (event: Event) =>
  event.posterUrl || EVENT_IMAGES[event.category] || EVENT_IMAGES.Movie;

const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const EventCard = ({ event, variant = 'grid' }: EventCardProps) => {
  const navigate = useNavigate();
  const img = getImage(event);

  if (variant === 'featured') {
    return (
      <div
        onClick={() => navigate(`/events/${event.id}`)}
        className="flex-shrink-0 w-64 rounded-xl overflow-hidden cursor-pointer transition-all"
        style={cardStyle}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        }}
      >
        <div className="relative h-36 overflow-hidden">
          <img
            src={img}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = EVENT_IMAGES.Movie; }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)' }} />
          <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(event.category)}`}>
            {event.category}
          </span>
          <h3 className="absolute bottom-2 left-3 right-3 text-white text-sm font-semibold truncate">
            {event.title}
          </h3>
        </div>
        <div className="p-3">
          <p className="text-xs mb-3 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
            📍 {event.venue}, {event.city}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-primary">
              From ₹{event.category === 'Concert' ? '2500' : event.category === 'Sports' ? '1200' : '250'}
            </span>
            <button
              className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-red-600 transition-colors"
              onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`); }}
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/events/${event.id}`)}
      className="rounded-xl overflow-hidden cursor-pointer transition-all"
      style={cardStyle}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.15)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)';
      }}
    >
      <div className="relative h-28 overflow-hidden">
        <img
          src={img}
          alt={event.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = EVENT_IMAGES.Movie; }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
        <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(event.category)}`}>
          {event.category}
        </span>
        {event.language && (
          <span
            className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.7)' }}
          >
            {event.language}
          </span>
        )}
        <h3 className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold truncate">
          {event.title}
        </h3>
      </div>
      <div className="p-3">
        <p className="text-xs mb-1 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
          📍 {event.venue}
        </p>
        <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
          🗓️ {formatDate(event.dateTime)}
        </p>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            ⏱️ {formatDuration(event.durationMins)}
          </span>
        </div>
        <button className="w-full bg-primary text-white text-xs py-2 rounded-lg font-medium hover:bg-red-600 transition-colors">
          Book Now
        </button>
      </div>
    </div>
  );
};

export default EventCard;