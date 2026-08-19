// The move-choosing brain: the real engine's aggressive king-hunt search behind the exported
// opening book, run through the engine's Scala.js build. The engine parses the DFEN itself
// (dice pool included), enumerates the legal turns, consults the book, and evaluates — so the
// bot needs nothing from the webhook envelope but state.dfen. Swap the ALGORITHM (or the whole
// function) to change how the bot plays.
import { DiceChess } from '@fortemate/dicechess-engine';
import book from '../opening_book.json' with { type: 'json' };

const ALGORITHM = 'aggressive-book';
const openingBookTsv = Object.entries(book)
  .map(([position, moves]) => `${position}\t${moves}`)
  .join('\n');

// Register the opening-book decorator over `aggressive`, once per isolate. `registerOpeningBookBot`
// is idempotent enough for this: a warm isolate that already registered simply re-registers.
if (!DiceChess.registerOpeningBookBot(openingBookTsv, 'aggressive', ALGORITHM, 'Aggressive + Book')) {
  throw new Error('Failed to register the aggressive opening-book bot');
}

/** DFEN in, the turn's UCI micro-moves out. `[]` = pass (no legal move; the server auto-passes). */
export function chooseMoves(dfen: string): string[] {
  const result = DiceChess.getBestMove(dfen, { algorithm: ALGORITHM });
  const moves = result.moves;
  return moves.map((m) => m.from + m.to + (m.promotion ?? ''));
}
