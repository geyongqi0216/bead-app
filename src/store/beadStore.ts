// src/store/beadStore.ts
import { defineStore } from 'pinia'
import { MARD_PALETTE, type MardColor } from '../constants/mard-palette'

// 修改：10g = 1000颗 -> 1g = 100颗
const GRAM_TO_COUNT = 100

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
            const item = this.inventory.find(i => i.id === id)
            return item ? item.stock : 0
        }
    }
})