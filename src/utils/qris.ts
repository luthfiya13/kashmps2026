// src/utils/qris.ts

export function generateQRIS(amount: number): string {
  // String asli dari Anda (Base Static)
  let baseQRIS = "00020101021126610014COM.GO-JEK.WWW01189360091434963481800210G4963481800303UMI51440014ID.CO.QRIS.WWW0215ID10264841120850303UMI5204829953033605802ID5919HMPS Sains Data UIN6009SUKOHARJO61055716862070703A0163046730";

  // 1. Buang 4 karakter terakhir (CRC lama: 6730)
  let payload = baseQRIS.slice(0, -4);

  // 2. Ubah Tag 01 dari 11 (Static) menjadi 12 (Dynamic)
  payload = payload.replace("010211", "010212");

  // 3. Pisahkan bagian sebelum Tag 58 (Country Code) untuk menyisipkan Tag 54 (Amount)
  // Tag 58 biasanya diawali dengan '5802ID'
  const splitPart = payload.split("5802ID");
  
  const amountStr = amount.toString();
  const tag54 = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
  
  // Gabungkan kembali: [Bagian A] + [Tag 54] + 5802ID + [Bagian B]
  payload = splitPart[0] + tag54 + "5802ID" + splitPart[1];

  // 4. Hitung CRC16-CCITT (False)
  const finalPayload = payload + crc16(payload);
  
  return finalPayload;
}

function crc16(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}
