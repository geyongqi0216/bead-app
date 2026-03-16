// Pinia 状态仓库 (库存、色表)
import { defineStore } from 'pinia'
import { MARD_PALETTE, type MardColor } from '../constants/mard-palette'

interface BeadStock {
    id: string;
    stock: number;
}

export const useBeadStore = defineStore('bead', {
    state: () => ({
        // 整个 MARD 色库
        palette: MARD_PALETTE as MardColor[],
        // 用户库存数据
        inventory: [] as BeadStock[],
    }),
    actions: {
        updateStock(id: string, amount: number) {
            const item = this.inventory.find(i => i.id === id)
            if (item) {
                item.stock = amount
            } else {
                this.inventory.push({ id, stock: amount })
            }
        },
        getStock(id: string): number {
            const item = this.inventory.find(i => i.id === id)
            return item ? item.stock : 0
        }
    },
    // 如果安装了 pinia-plugin-persistedstate，可以开启持久化
    // persist: true,
})