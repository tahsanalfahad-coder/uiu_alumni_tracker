import React from 'react';
import { Card, Badge } from '@uiu/ui';
import { Calendar, Clock, MapPin, Ticket } from 'lucide-react';
import './GuestEventsView.css';

export default function GuestEventsView({ eventList = [] }) {
  return (
    <div className="guest-events-simple-page">
      <div className="page-header-row">
        <div>
          <h1 className="heading-h1">UIU Campus Events</h1>
          <p className="text-muted">Public event schedule of United International University.</p>
        </div>
      </div>

      <div className="grid-3-col">
        {eventList.map((evt) => (
          <Card key={evt.id || evt._id} className="guest-simple-event-card">
            <div className="guest-event-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge variant="warning">{evt.category || 'Event'}</Badge>
              <Badge variant={!evt.cost || evt.cost.toLowerCase() === 'free' ? 'success' : 'accent'}>
                <Ticket size={12} style={{ marginRight: '4px' }} />
                Cost: {evt.cost || 'Free'}
              </Badge>
            </div>

            <h3 className="guest-event-name">{evt.title}</h3>

            <div className="guest-event-details-list">
              <div className="guest-event-detail-item">
                <Calendar size={16} className="text-gold" />
                <span>Date: <strong>{evt.date}</strong></span>
              </div>
              <div className="guest-event-detail-item">
                <Clock size={16} className="text-gold" />
                <span>Time Schedule: <strong>{evt.time}</strong></span>
              </div>
              <div className="guest-event-detail-item">
                <MapPin size={16} className="text-gold" />
                <span>Place: <strong>{evt.location}</strong></span>
              </div>
              <div className="guest-event-detail-item">
                <Ticket size={16} className="text-gold" />
                <span>Attend Cost: <strong>{evt.cost || 'Free'}</strong></span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
