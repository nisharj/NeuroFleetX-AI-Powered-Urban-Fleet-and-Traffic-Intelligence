import { useNavigate } from 'react-router-dom';

function QuickActions({ onBookRide, onViewHistory }) {
  const actions = [
    {
      id: 'book',
      title: 'Book a Ride',
      description: 'Request a new ride instantly',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      onClick: onBookRide
    },
    {
      id: 'history',
      title: 'Ride History',
      description: 'View completed rides below',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
      onClick: onViewHistory
    }
  ];

  return (
    <div className="quick-actions-section">
      <h3 className="section-title">Quick Actions</h3>
      <div className="quick-actions-grid">
        {actions.map((action) => (
          <button
            key={action.id}
            className="quick-action-card"
            style={{ background: action.gradient }}
            onClick={action.onClick}
          >
            <div className="quick-action-icon">{action.icon}</div>
            <div className="quick-action-content">
              <h4 className="quick-action-title">{action.title}</h4>
              <p className="quick-action-description">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
