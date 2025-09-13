const { jsPDF } = window.jspdf

const btn = document.querySelector('.btn')
const input = document.querySelector('.input-arq')
const nameInput = document.querySelector('.nameInput')

// Classifica entre imagem ou texto
function classifyFiles(arquivos, txtArray, imgArray) {
    for (let arquivo of arquivos) {
        if (arquivo.type === 'text/plain') {
            txtArray.push(arquivo)
        } else if (arquivo.type.startsWith('image/')) {
            imgArray.push(arquivo)
        } else {
            window.alert('Arquivo não suportado:' + arquivo.name)
        }
    }
}

// Promessa que recebe o arquivo e o tipo dele (texto ou imagem)
const promiseReadFile = (file, method) => {
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        // Quando reader.onload estiver pronto (quando o arquivo carregar), vai retornar reader.result
        reader.onload = () => { resolve(reader.result) }
        reader.onerror = (error) => { reject(error) }

        // Verifica o tipo do arquivo e lê ele dependendo disso
        if (method === 'text') {
            reader.readAsText(file)
        } else if (method === 'dataURL') {
            reader.readAsDataURL(file)
        }

    })
}

btn.addEventListener('click', async () => {
    const arquivos = input.files
    const fileName = nameInput.value

    if (!input.files.length) {
        window.alert('Por favor, selecione ao menos um arquivo.');
        return;
    }

    const textos = []
    const imgs = []

    classifyFiles(arquivos, textos, imgs)

    // Chama a promise lá de trás
    const textPromises = textos.map(texto => promiseReadFile(texto, 'text'))
    const imgPromises = imgs.map(img => promiseReadFile(img, 'dataURL'))

    try {
        // Declara o conteudoTXT e o conteudoIMG quando as promises estiverem completas, e atríbui o resultado das promises pra essas variáveis
        const [conteudoTXT, conteudoIMG] = await Promise.all([
            Promise.all(textPromises),
            Promise.all(imgPromises)
        ])

        let pdf = new jsPDF({ orientation: "p", format: "a4" })
        let firstPage = true

        // Formata o texto no pdf
        conteudoTXT.forEach(texto => {
            if (!firstPage) {
                pdf.addPage()
            }
            const lines = pdf.splitTextToSize(texto, 180) // divide o texto em linhas para saber se vai caber tudo na página ou não
            pdf.text(lines, 15, 20) // texto, margem da esquerda, margem de cima
            firstPage = false
        })

        // formata a imagem no pdf
        conteudoIMG.forEach((imagem) => {
            if (!firstPage) {
                pdf.addPage()
            }

            // informa o jspdf o tipo da img
            pdf.addImage(imagem, imagem.startsWith("data:image/png") ? "PNG" : "JPEG", 15, 40, 180, 160)

            firstPage = false
        })

        pdf.save(`${(fileName) ? fileName : 'novoPDF'}.pdf`);
    } catch (error) {
        console.error('F:', error)
    }

    input.value='';
})