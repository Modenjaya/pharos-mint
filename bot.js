require('dotenv').config();

const { Web3 } = require('web3');

// --- KONFIGURASI ---
const rpcUrl = 'https://testnet.dplabs-internal.com';
const contractAddress = '0xe71188DF7be6321ffd5aaA6e52e6c96375E62793'; 

const txDetails = {
    chainId: 688688,
    data: "0x84bb1e4200000000000000000000000007f8ec2b79b7a1998fd0b21a4668b0cf1ca72c020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    gas: "0xf4240",
    gasPrice: "0x47868c00",
    to: "0xe71188DF7be6321ffd5aaA6e52e6c96375E62793",
    value: "0xde0b6b3a7640000"
};
// --- END KONFIGURASI ---

const web3 = new Web3(rpcUrl);

// Fungsi untuk melakukan mint NFT untuk satu kunci pribadi
async function mintNftForWallet(privateKey, walletIndex) {
    if (!privateKey) {
        console.warn(`Peringatan: Kunci pribadi untuk dompet ${walletIndex} tidak ditemukan. Melewati dompet ini.`);
        return;
    }

    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    // Tambahkan akun ke wallet Web3.js untuk penandatanganan otomatis
    web3.eth.accounts.wallet.add(account);

    const fromAddress = account.address;
    console.log(`\n--- Memulai mint NFT untuk Dompet ${walletIndex}: ${fromAddress} ---`);

    try {
        // Dapatkan nonce terbaru untuk alamat ini
        const currentNonce = await web3.eth.getTransactionCount(fromAddress, 'pending');
        console.log(`Nonce saat ini untuk ${fromAddress}: ${currentNonce}`);

        const tx = {
            from: fromAddress,
            to: txDetails.to,
            data: txDetails.data,
            gas: web3.utils.hexToNumber(txDetails.gas),
            gasPrice: web3.utils.hexToNumber(txDetails.gasPrice),
            value: web3.utils.hexToNumberString(txDetails.value),
            nonce: currentNonce,
            chainId: txDetails.chainId
        };

        console.log('Membangun transaksi dengan detail:', tx);

        // Mengirim transaksi
        const receipt = await web3.eth.sendTransaction(tx);

        console.log('Transaksi terkirim. Menunggu konfirmasi...');
        console.log('Transaction Receipt:', receipt);

        if (receipt.status) {
            console.log(`🎉 NFT Minting Berhasil untuk Dompet ${walletIndex}! Hash Transaksi: ${receipt.transactionHash}`);
            console.log(`Lihat transaksi di explorer: https://pharos-testnet.socialscan.io/tx/${receipt.transactionHash}`);
        } else {
            console.error(`❌ NFT Minting Gagal untuk Dompet ${walletIndex}. Hash Transaksi: ${receipt.transactionHash}`);
        }

    } catch (error) {
        console.error(`Terjadi kesalahan saat minting NFT untuk Dompet ${walletIndex} (${fromAddress}):`, error.message);
        if (error.code === -32000 && error.message.includes('insufficient funds')) {
            console.error('Saldo tidak cukup untuk gas atau biaya minting.');
        } else if (error.message.includes('nonce too low')) {
            console.error('Nonce terlalu rendah. Coba jalankan ulang atau periksa transaksi yang tertunda.');
        } else {
            console.error('Detail Error:', error);
        }
    } finally {
        // Hapus akun dari wallet Web3.js setelah selesai untuk mencegah nonce bentrok jika ada banyak transaksi
        web3.eth.accounts.wallet.remove(fromAddress);
    }
}

async function runMintingBot() {
    const privateKeys = [];
    let i = 1;
    while (process.env[`PRIVATE_KEY_${i}`]) {
        privateKeys.push(process.env[`PRIVATE_KEY_${i}`]);
        i++;
    }

    if (privateKeys.length === 0) {
        console.error('Error: Tidak ada kunci pribadi yang ditemukan di file .env (misal: PRIVATE_KEY_1, PRIVATE_KEY_2).');
        process.exit(1);
    }

    console.log(`Ditemukan ${privateKeys.length} kunci pribadi untuk minting.`);

    for (let j = 0; j < privateKeys.length; j++) {
        await mintNftForWallet(privateKeys[j], j + 1);
        // Opsional: tambahkan delay antar transaksi jika diperlukan
        // await new Promise(resolve => setTimeout(resolve, 5000)); // Delay 5 detik
    }

    console.log('\n--- Proses minting selesai untuk semua dompet. ---');
}

// Jalankan bot
runMintingBot();
