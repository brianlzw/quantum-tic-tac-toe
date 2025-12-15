interface TutorialPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function TutorialPanel({ isOpen, onToggle }: TutorialPanelProps) {
  return (
    <div className={`tutorial-panel ${!isOpen ? 'hidden' : ''}`}>
      <div className="tutorial-panel-header">
        <h2>How to play</h2>
        <button className="close-button" onClick={onToggle}>
          ×
        </button>
      </div>
      <div className="tutorial-panel-content">
        <section>
          <h3>Basic Rules</h3>
          <ul>
            <li>Each turn, place <strong>two marks</strong> (spooky marks) in different squares.</li>
            <li>Marks are labeled with your emoji and the move number (e.g., 🐊₁, 🐘₂).</li>
            <li>The two squares you mark become <strong>entangled</strong>.</li>
          </ul>
        </section>

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

        <section>
          <h3>Winning</h3>
          <ul>
            <li>First player to get <strong>three classical marks in a row</strong> wins.</li>
            <li>If both players get three-in-a-row after a collapse, the line with the <strong>lower maximum move number</strong> wins (1 point).</li>
            <li>The other player gets ½ point.</li>
          </ul>
        </section>

        <section>
          <h3>Strategy Tips</h3>
          <ul>
            <li>Create cycles strategically to force favorable collapses.</li>
            <li>Consider which player will choose the collapse when planning moves.</li>
            <li>Try to create multiple winning opportunities simultaneously.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

