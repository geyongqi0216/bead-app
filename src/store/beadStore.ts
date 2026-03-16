// src/store/beadStore.ts
import { defineStore } from 'pinia'
import { MARD_PALETTE, type MardColor } from '../constants/mard-palette'

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
// 使用环境变量，如果没有则回退到开发环境
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/beads/inventory';

export const useBeadStore = defineStore('bead', {
    state: () => ({
        palette: MARD_PALETTE as MardColor[],
        inventory: [] as { id: string; stock: number }[],
        syncStatus: 'saved' as 'saved' | 'saving' | 'error',
    }),

    actions: {
        // 获取 Token 的辅助函数
        // src/store/beadStore.ts (Vue 项目)

        async getAuthHeaders(): Promise<Headers> {
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');

            // @ts-ignore
            const clerk = window.Clerk;

            if (clerk?.session) {
                const token = await clerk.session.getToken();
                console.log("成功获取 Token:", token ? "已获取" : "为空");
                if (token) {
                    headers.append('Authorization', `Bearer ${token}`);
                }
            } else {
                console.warn("未发现有效的 Clerk Session，请求可能报 401");
            }
            return headers;
        },
        async fetchInitialData() {
            try {
                const headers = await this.getAuthHeaders();
                const res = await fetch(API_URL, {
                    headers // 这里的类型现在完全匹配了
                });

                if (res.ok) {
                    const data = await res.json();
                    this.inventory = data.map((item: any) => ({
                        id: item.colorId,
                        stock: item.count
                    }));
                }
            } catch (e) {
                console.error("同步失败", e);
            }
        },

        triggerAutoSave() {
            this.syncStatus = 'saving';
            if (saveTimeout) clearTimeout(saveTimeout);

            saveTimeout = setTimeout(async () => {
                try {
                    const headers = await this.getAuthHeaders();
                    const res = await fetch(API_URL, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({ inventory: this.inventory })
                    });

                    if (res.ok) {
                        this.syncStatus = 'saved';
                    } else {
                        this.syncStatus = 'error';
                    }
                } catch (e) {
                    this.syncStatus = 'error';
                }
            }, 2000);
        },
        updateStock(id: string, count: number) {
            const item = this.inventory.find(i => i.id === id)
            if (item) item.stock = count
            else this.inventory.push({ id, stock: count })

            this.triggerAutoSave(); // 修改后触发保存
        },

        updateStockByWeight(id: string, grams: number) {
            this.updateStock(id, Math.floor(grams * 100))
        },

        getStock(id: string): number {
            const item = this.inventory.find(i => i.id === id)
            return item ? item.stock : 0
        }
    }
})