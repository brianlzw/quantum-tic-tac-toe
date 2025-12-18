import { useState, useEffect } from 'react';

interface TutorialPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface TutorialSection {
  id: number;
  title: string;
  content: JSX.Element;
}

export default function TutorialPanel({ isOpen, onToggle }: TutorialPanelProps) {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  // Reset to first slide when panel closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentSlide(0);
    }
  }, [isOpen]);

  const sections: TutorialSection[] = [
    {
      id: 0,
      title: '3 concepts of quantum theory',
      content: (
        <>
          <section>
            <h3>3 concepts of Quantum Theory</h3>
            
            <p>Let's look at a short explainer:</p>

            <div className="youtube-video-container">
              <iframe
                width="100%"
                height="180"
                src="https://www.youtube.com/embed/HhUxR8fkFi4"
                title="Quantum Tic-Tac-Toe Tutorial"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>

            <ul>
              <li><strong>Superposition</strong>: the ability of quantum objects to be in two places at once.</li>
              <li><strong>Entanglement</strong>: the phenomenon where distant parts of a quantum system display correlations that cannot be explained by either timelike causality or common cause.</li>
              <li><strong>Collapse</strong>: the phenomenon where the quantum states of a system are reduced to classical states. Collapses occur when a measurement happens.</li>
            </ul>

            <p>Now let's move on to the rule of the game.</p>
          </section>
        </>
      ),
    },
    {
      id: 1,
      title: 'Basic Rules',
      content: (
        <section>
          <h3>Basic Rules</h3>
          <ul>
            <li>Each turn, place <strong>two marks</strong> (spooky marks) in different squares.</li>
            <li>Marks are labeled with your emoji and the move number (e.g., 🐊₁, 🐘₂).</li>
            <li>The two squares you mark become <strong>entangled</strong>.</li>
          </ul>
        </section>
      ),
    },
    {
      id: 2,
      title: 'Cycles and Collapse',
      content: (
        <section>
          <h3>Cycles and Collapse</h3>
          <ul>
            <li>When a <strong>cycle</strong> is formed in the entanglement graph, a measurement occurs.</li>
            <li>The <strong>other player</strong> (who didn't create the cycle) chooses how to collapse it.</li>
            <li>They pick one of the two squares from the last move.</li>
            <li>This choice forces all connected entanglements to collapse into classical marks.</li>
            <li>Once a square has a classical mark, it's locked and can't receive more spooky marks.</li>
          </ul>
        </section>
      ),
    },
    {
      id: 3,
      title: 'Winning',
      content: (
        <section>
          <h3>Winning</h3>
          <ul>
            <li>First player to get <strong>three classical marks in a row</strong> wins.</li>
            <li>If both players get three-in-a-row after a collapse, the line with the <strong>lower maximum move number</strong> wins (1 point).</li>
            <li>The other player gets ½ point.</li>
          </ul>
        </section>
      ),
    },
    {
      id: 4,
      title: 'Strategy Tips',
      content: (
        <section>
          <h3>Strategy Tips</h3>
          <ul>
            <li>Create cycles strategically to force favorable collapses.</li>
            <li>Consider which player will choose the collapse when planning moves.</li>
            <li>Try to create multiple winning opportunities simultaneously.</li>
          </ul>
        </section>
      ),
    },
  ];

  const handleNext = () => {
    if (currentSlide < sections.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className={`tutorial-panel ${!isOpen ? 'hidden' : ''}`}>
      <div className="tutorial-panel-header">
        <h2>Tutorial</h2>
        <button className="close-button" onClick={onToggle}>
          ×
        </button>
      </div>
      <div className="tutorial-panel-content">
        <div className="tutorial-slide">
          <div className="tutorial-slide-content">
            {sections[currentSlide].content}
          </div>
          <div className="tutorial-navigation">
            <button
              className="tutorial-nav-button"
              onClick={handlePrev}
              disabled={currentSlide === 0}
            >
              ← Prev
            </button>
            <div className="tutorial-slide-indicator">
              {currentSlide + 1} / {sections.length}
            </div>
            <button
              className="tutorial-nav-button"
              onClick={handleNext}
              disabled={currentSlide === sections.length - 1}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

