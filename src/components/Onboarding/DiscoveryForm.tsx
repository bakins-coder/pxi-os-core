import React, { useState, useEffect } from 'react';
import './DiscoveryForm.css';
import { ShoppingBag, Stethoscope, Scale, Truck, BookOpen, Users, Calculator, ShieldCheck, Zap } from 'lucide-react';

const INDUSTRIES = [
  { id: 'Retail', name: 'Retail', icon: <ShoppingBag /> },
  { id: 'Dental Clinic', name: 'Dental Clinic', icon: <Stethoscope /> },
  { id: 'Legal Firm', name: 'Legal Firm', icon: <Scale /> },
  { id: 'Logistics', name: 'Logistics', icon: <Truck /> },
  { id: 'Accounting Firm', name: 'Accounting Firm', icon: <Calculator /> },
  { id: 'Consulting Firm', name: 'Consulting Firm', icon: <Zap /> },
  { id: 'Optician', name: 'Optician', icon: <ShieldCheck /> }
];

const QUESTIONS = [
  {
    id: 'type',
    title: 'Type of Organisation',
    subtitle: 'Which industry best describes your business?',
    type: 'choice'
  },
  {
    id: 'name',
    title: 'Organisation Name & Mission',
    subtitle: 'What is the name and primary objective of your firm?',
    type: 'text',
    placeholder: 'e.g. Specialist Dental Clinic - Focused on Orthodontic Care'
  },
  {
    id: 'departments',
    title: 'Departmental Structure',
    subtitle: 'Which areas require AI staffing?',
    type: 'text',
    placeholder: 'e.g. Front Desk, Operations, Billing'
  },
  {
    id: 'model',
    title: 'Operational Model',
    subtitle: 'Agentic (Autonomous) or Advisory (Human-led)?',
    type: 'choice',
    options: [
      { id: 'Agentic', name: 'Fully Agentic', description: 'AI employees work proactively after approval.' },
      { id: 'Advisory', name: 'Advisory', description: 'AI employees act as smart consultants.' }
    ]
  },
  {
    id: 'security',
    title: 'Security & Compliance',
    subtitle: 'Which regional regulations or security standards apply?',
    type: 'text',
    placeholder: 'e.g. GDPR, POPIA, HIPAA, End-to-End Encryption'
  },
  {
    id: 'sync',
    title: 'CEO Sync Frequency',
    subtitle: 'How often should the AI team push executive summaries?',
    type: 'choice',
    options: [
      { id: 'Daily', name: 'Daily' },
      { id: 'Weekly', name: 'Weekly' },
      { id: 'OnDemand', name: 'On Demand Only' }
    ]
  }
];

interface DiscoveryAnswers {
  type: string;
  name: string;
  departments: string;
  model: string;
  security: string;
  sync: string;
  [key: string]: string;
}

interface DiscoveryFormProps {
  onComplete?: (answers: DiscoveryAnswers) => void;
}

export const DiscoveryForm: React.FC<DiscoveryFormProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<DiscoveryAnswers>({
    type: '',
    name: '',
    departments: '',
    model: '',
    security: '',
    sync: ''
  });

  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (onComplete) onComplete(answers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateAnswer = (id: string, val: string) => {
    setAnswers(prev => ({ ...prev, [id]: val }));
  };

  const currentQuestion = QUESTIONS[currentStep];
  const isLastStep = currentStep === QUESTIONS.length - 1;
  const isStepValid = answers[currentQuestion.id] !== '';

  return (
    <div className="discovery-container">
      <div className="float-1"></div>
      <div className="float-2"></div>
      
      <div className="discovery-card">
        <div className="discovery-progress">
          {QUESTIONS.map((_, idx) => (
            <div 
              key={idx} 
              className={`progress-dot ${idx <= currentStep ? 'active' : ''}`}
            />
          ))}
        </div>

        <div className="discovery-header">
          <h1>{currentQuestion.title}</h1>
          <p>{currentQuestion.subtitle}</p>
        </div>

        <div className="discovery-body">
          {currentQuestion.id === 'type' ? (
            <div className="industry-grid">
              {INDUSTRIES.map(ind => (
                <div 
                  key={ind.id}
                  className={`industry-option ${answers.type === ind.id ? 'selected' : ''}`}
                  onClick={() => updateAnswer('type', ind.id)}
                >
                  <div className="industry-icon">{ind.icon}</div>
                  <div className="industry-name">{ind.name}</div>
                </div>
              ))}
            </div>
          ) : currentQuestion.type === 'choice' ? (
            <div className="industry-grid">
              {(currentQuestion.options || []).map((opt: any) => (
                <div 
                  key={opt.id}
                  className={`industry-option ${answers[currentQuestion.id] === opt.id ? 'selected' : ''}`}
                  onClick={() => updateAnswer(currentQuestion.id, opt.id)}
                >
                  <div className="industry-name" style={{ fontWeight: 600 }}>{opt.name}</div>
                  {opt.description && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>{opt.description}</div>}
                </div>
              ))}
            </div>
          ) : (
            <input 
              type="text"
              className="input-field"
              placeholder={currentQuestion.placeholder}
              value={answers[currentQuestion.id]}
              onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
              autoFocus
            />
          )}
        </div>

        <div className="discovery-actions">
          {currentStep > 0 && (
            <button className="btn-back" onClick={handleBack}>Back</button>
          )}
          <button 
            className="btn-next" 
            onClick={handleNext}
            disabled={!isStepValid}
          >
            {isLastStep ? 'Provision Workspace' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};
