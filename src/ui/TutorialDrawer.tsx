interface TutorialDrawerProps {
  onClose: () => void;
}

export default function TutorialDrawer({ onClose }: TutorialDrawerProps) {
  return (
    <div className="tutorial-overlay" onClick={onClose}>
      <div className="tutorial-drawer" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <h2>How to Play Quantum Tic-Tac-Toe</h2>
        
        <section>
          <h3>Basic Rules</h3>
          <ul>
            <li>Each turn, place <strong>two marks</strong> (spooky marks) in different squares.</li>
            <li>Marks are labeled with your letter (X or O) and the move number (e.g., X₁, O₂).</li>
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

