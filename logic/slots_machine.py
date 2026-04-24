import random

class SlotsEngine:
    SYMBOLS_CONFIG = {
        "cherry": {"weight": 40, "multiplier": 2},
        "lemon": {"weight": 30, "multiplier": 2},
        "orange": {"weight": 20, "multiplier": 2},
        "plum": {"weight": 10, "multiplier": 15},
        "seven": {"weight": 5, "multiplier": 50},
        "crystal": {"weight": 1, "multiplier": 100},
    }
    
    GRID_SIZE = 3
    
    def __init__(self):
        self.symbols = list(SlotsEngine.SYMBOLS_CONFIG.keys())
        self.weights = [s["weight"] for s in SlotsEngine.SYMBOLS_CONFIG.values()]

    def _generate_grid(self):
        """Генерирует сетку 3x3 на основе весов символов."""
        flat_grid = random.choices(
            self.symbols, weights=self.weights, k=self.GRID_SIZE * self.GRID_SIZE
        )
        return [
            flat_grid[i : i + self.GRID_SIZE] for i in range(0, len(flat_grid), self.GRID_SIZE)
        ]

    def _check_win(self, grid):
        """Проверяет горизонтали и диагонали на наличие выигрышных линий."""
        wins = []

        for r in range(SlotsEngine.GRID_SIZE):
            if grid[r][0] == grid[r][1] == grid[r][2]:
                symbol = grid[r][0]
                wins.append(
                    {
                        "line": f"row_{r}",
                        "symbol": symbol,
                        "mult": self.SYMBOLS_CONFIG[symbol]["multiplier"],
                    }
                )

        if grid[0][0] == grid[1][1] == grid[2][2]:
            symbol = grid[0][0]
            wins.append(
                {
                    "line": "diag_main",
                    "symbol": symbol,
                    "mult": self.SYMBOLS_CONFIG[symbol]["multiplier"],
                }
            )

        if grid[0][2] == grid[1][1] == grid[2][0]:
            symbol = grid[0][2]
            wins.append(
                {
                    "line": "diag_anti",
                    "symbol": symbol,
                    "mult": self.SYMBOLS_CONFIG[symbol]["multiplier"],
                }
            )

        return wins

    def spin(self, bet_amount):
        """
        Основной метод 'крутить барабаны'.
        Возвращает результат вращения, сумму выигрыша и общую информацию.
        """
        grid = self._generate_grid()
        winning_lines = self._check_win(grid)

        total_multiplier = sum(line["mult"] for line in winning_lines)
        payout = bet_amount * total_multiplier

        return {
            "grid": grid,
            "wins": winning_lines,
            "payout": payout,
            "is_win": payout > 0,
        }