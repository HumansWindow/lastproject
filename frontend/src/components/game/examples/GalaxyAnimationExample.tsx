import React, { useState } from 'react';
import { useGalaxyAnimation } from '../../../animations/galaxy';

/**
 * Example component demonstrating the use of Galaxy animation
 * with React hooks and TypeScript
 */
const GalaxyAnimationExample: React.FC = () => {
  const [currentSection, setCurrentSection] = useState('section1');
  
  // Initialize galaxy animation with custom configuration
  const { 
    animation, 
    isInitialized, 
    flyOver,
    transition
  } = useGalaxyAnimation({
    config: {
      // Customize galaxy appearance
      numArms: 4,
      numStarsPerArm: 4000,
      verticalScatter: 0.3,
      armWidth: 0.3
    },
    // Auto-setup navigation between sections with "navigate-btn" class
    autoSetupNavigation: true,
    // Initialize on component mount
    initializeOnMount: true
  });

  // Handle navigation between sections
  const handleNavigate = async (targetId: string) => {
    // Use camera flyover when both sections have Galaxy class
    if (document.getElementById(currentSection)?.classList.contains('Galaxy') &&
        document.getElementById(targetId)?.classList.contains('Galaxy')) {
      await flyOver(currentSection, targetId);
    } else {
      // Use regular transition for non-Galaxy sections
      transition(currentSection, targetId);
    }
    
    // Update current section state
    setCurrentSection(targetId);
  };

  return (
    <div className="galaxy-example">
      <h1>Galaxy Animation Example</h1>
      
      {/* Section 1 - Galaxy Background */}
      <section id="section1" className="ah-section Galaxy active-section">
        <div className="ah-section-content">
          <div className="content-wrapper">
            <div className="row">
              <div className="col-md-6 left-content">
                <h2>Galaxy Section 1</h2>
                <p>This section has a galaxy background animation.</p>
              </div>
              <div className="col-md-6 right-content">
                <div className="image-container">
                  <img src="/images/planet.svg" alt="Planet" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Navigation buttons */}
        <div className="ah-nav-button bottom-nav-button">
          <button 
            className="ah-button navigate-btn"
            data-target="#section2"
            onClick={() => handleNavigate('section2')}
          >
            Continue
          </button>
        </div>
      </section>
      
      {/* Section 2 - Galaxy Background */}
      <section id="section2" className="ah-section Galaxy" style={{ display: 'none' }}>
        <div className="ah-section-content">
          <div className="content-wrapper">
            <div className="row">
              <div className="col-md-6 left-content">
                <h2>Galaxy Section 2</h2>
                <p>When navigating between two galaxy sections, a camera flyover effect will be used.</p>
              </div>
              <div className="col-md-6 right-content">
                <div className="image-container">
                  <img src="/images/galaxy.svg" alt="Galaxy" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Navigation buttons */}
        <div className="ah-nav-button top-nav-button">
          <button 
            className="ah-button navigate-btn"
            data-target="#section1"
            onClick={() => handleNavigate('section1')}
          >
            Back
          </button>
        </div>
        <div className="ah-nav-button bottom-nav-button">
          <button 
            className="ah-button navigate-btn"
            data-target="#section3"
            onClick={() => handleNavigate('section3')}
          >
            Next Section
          </button>
        </div>
      </section>
      
      {/* Section 3 - Regular (Non-Galaxy) */}
      <section id="section3" className="ah-section" style={{ display: 'none' }}>
        <div className="ah-section-content">
          <div className="content-wrapper">
            <div className="row">
              <div className="col-md-6 left-content">
                <h2>Regular Section</h2>
                <p>This section does not have a galaxy background.</p>
                <p>When navigating to/from this section, a simple fade transition will be used.</p>
              </div>
              <div className="col-md-6 right-content">
                <div className="card">
                  <div className="card-body">
                    <h3>Animation Status</h3>
                    <p>Galaxy Animation Initialized: {isInitialized ? 'Yes' : 'No'}</p>
                    <p>Active Stars: {animation?.getActiveStarCount() || 'Unknown'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Navigation buttons */}
        <div className="ah-nav-button top-nav-button">
          <button 
            className="ah-button navigate-btn"
            data-target="#section2"
            onClick={() => handleNavigate('section2')}
          >
            Back
          </button>
        </div>
      </section>
      
      {/* Controls overlay */}
      <div className="controls-overlay">
        <div className="control-panel">
          <h3>Navigation Controls</h3>
          <div className="btn-group">
            <button 
              className={`btn ${currentSection === 'section1' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleNavigate('section1')}
            >
              Section 1
            </button>
            <button 
              className={`btn ${currentSection === 'section2' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleNavigate('section2')}
            >
              Section 2
            </button>
            <button 
              className={`btn ${currentSection === 'section3' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleNavigate('section3')}
            >
              Section 3
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalaxyAnimationExample;