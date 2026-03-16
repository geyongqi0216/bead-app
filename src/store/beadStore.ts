import { defineStore } from 'pinia'
import { MARD_PALETTE, type MardColor } from '../constants/mard-palette'

const GRAM_TO_COUNT = 250 // 1克 ≈ 250颗

export const useBeadStore = defineStore('bead', {
    state: () => ({
        palette: MARD_PALETTE as MardColor[],
        inventory: [] as { id: string; stock: number }[],
    }),
    actions: {
        updateStock(id: string, count: number) {
            const item = this.inventory.find(i => i.id === id)
            if (item) item.stock = count
            else this.inventory.push({ id, stock: count })
        },
        updateStockByWeight(id: string, grams: number) {
            this.updateStock(id, Math.floor(grams * GRAM_TO_COUNT))
        },
        getStock(id: string): number {
            return this.inventory.find(i => i.id === id)?.stock || 0
        }
    }
})