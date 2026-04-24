from logic.slots_machine import SlotsEngine

def run_simulation(spins = 1000, bet = 10.0):
    ''' RTP-тестирование слотов'''
    engine = SlotsEngine()
    total_bet = spins * bet
    total_payout = 0
    wins_count = 0

    print(f"🚀 Запуск симуляции: {spins} спинов со ставкой {bet}...")

    for _ in range(spins):
        result = engine.spin(bet)
        total_payout += result["payout"]
        if result["is_win"]:
            wins_count += 1

    rtp = (total_payout / total_bet) * 100

    print("-" * 30)
    print("📊 РЕЗУЛЬТАТЫ:")
    print(f"Сыграно игр: {spins}")
    print(f"Всего поставлено: {total_bet}")
    print(f"Всего выплачено: {total_payout:.2f}")
    print(
        f"Количество выигрышей: {wins_count} (Hit Rate: {(wins_count / spins) * 100:.2f}%)"
    )
    print(f"🔥 RTP: {rtp:.2f}%")
    print("-" * 30)

    if 90 <= rtp <= 95:
        print("✅ Баланс в норме (90-95%)")
    else:
        print("⚠️ Нужна корректировка весов или множителей!")


COUNT_SIMULATION = 10_000
if __name__ == "__main__":
    run_simulation(COUNT_SIMULATION)