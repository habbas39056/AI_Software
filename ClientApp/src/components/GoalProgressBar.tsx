import React from 'react';
import { formatCurrency } from '../utils/currencyUtils';
import './GoalProgressBar.css';

interface GoalProgressBarProps {
  target: number;
  received: number;
  currency?: string;
}

const GoalProgressBar: React.FC<GoalProgressBarProps> = ({ target, received, currency = 'USD' }) => {
  const percentage = target > 0 ? Math.min(100, Math.round((received / target) * 100)) : 0;
  const remaining = Math.max(0, target - received);
  const monthString = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className="goal-progress-container">
      <div className="goal-header">
        <span className="goal-title">Monthly Goal — {monthString}</span>
        <span className="goal-percentage">{percentage}%</span>
      </div>
      
      <div className="progress-bar-bg">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      <div className="goal-footer">
        <span className="goal-stat">Received: <strong>{formatCurrency(received, currency)}</strong></span>
        <span className="goal-stat">Target: <strong>{formatCurrency(target, currency)}</strong></span>
        <span className="goal-stat">Remaining: <strong>{formatCurrency(remaining, currency)}</strong></span>
        <span className="goal-stat">Avg: <strong>{formatCurrency(0, currency)}</strong></span>
      </div>
    </div>
  );
};

export default GoalProgressBar;
