# Iknowball frontend handoff notes

## Logic tinh nang

Frontend hien tai la landing page Next.js theo style anh mau Sport News. Trang `app/page.tsx` render cac block: header, hero, today news, category grid, trending, headline slider, recent news, ranking, sports article va newsletter. De khong phu thuoc asset ngoai, cac khung anh dang dung cung file `public/design/landing-page.png` va crop bang `object-position`.

## Cho de loi

- Anh trong page phu thuoc `public/design/landing-page.png`; doi ten/xoa file nay se lam nhieu `next/image` bao loi.
- Cac crop hien la tam thoi vi dung anh screenshot tong; khi co asset tach rieng nen thay tung card bang anh that de net hon.
- Header tren mobile dang an menu va chi giu logo/search; neu can menu mobile can them drawer rieng.
- Day la giao dien tin tuc/landing, chua noi lai logic live score AI trong `lib/sports-data.ts`; khi dua tinh nang du doan vao can them lai disclaimer tren cac block prediction.
