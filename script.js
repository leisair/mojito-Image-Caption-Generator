document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    let currentImage = null;
    let watermarkText = '图片字幕生成器';

    // 图片加载处理
    document.getElementById('imageInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    currentImage = img;
                    generateSubtitledImage();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // 监听所有控件的变化
    const controls = ['lineHeight', 'fontSize', 'textColor', 'strokeColor', 'subtitleText', 'watermarkText', 'watermarkOpacity', 'watermarkStyle', 'watermarkSize'];
    controls.forEach(id => {
        document.getElementById(id).addEventListener('input', generateSubtitledImage);
    });

    // 生成按钮点击事件
    document.getElementById('generateBtn').addEventListener('click', generateSubtitledImage);

    // 保存按钮点击事件
    document.getElementById('saveBtn').addEventListener('click', () => {
        if (!canvas.toDataURL) return;
        const link = document.createElement('a');
        link.download = 'subtitled-image.png';
        link.href = canvas.toDataURL();
        link.click();
    });

    // 生成字幕图片
    function generateSubtitledImage() {
        if (!currentImage) return;

        // 获取所有配置
        const lineHeight = parseInt(document.getElementById('lineHeight').value);
        const fontSize = parseInt(document.getElementById('fontSize').value);
        const textColor = document.getElementById('textColor').value;
        const strokeColor = document.getElementById('strokeColor').value;
        const subtitleText = document.getElementById('subtitleText').value;
        const lines = subtitleText.split('\n').filter(line => line.trim());

        // 设置画布尺寸
        canvas.width = currentImage.width;
        canvas.height = currentImage.height + (lineHeight * lines.length);

        // 绘制图片
        ctx.drawImage(currentImage, 0, 0);

        // 设置文字样式
        ctx.textAlign = 'center';
        ctx.font = `${fontSize}px Arial`;
        ctx.lineWidth = 3;

        // 获取底部区域作为字幕背景
        const subtitleHeight = lineHeight * lines.length;
        const bottomArea = ctx.getImageData(0, currentImage.height - 20, canvas.width, 20);

        // 为每行字幕绘制背景和分割线
        lines.forEach((line, index) => {
            const y = currentImage.height + (index * lineHeight);
            
            // 重复底部区域作为字幕背景
            for (let i = 0; i < lineHeight; i++) {
                ctx.putImageData(bottomArea, 0, y + i);
            }

            // 添加分割线
            if (index > 0) {
                ctx.beginPath();
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 1;
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // 绘制文字轮廓
            ctx.lineWidth = 3;
            ctx.strokeStyle = strokeColor;
            ctx.strokeText(line, canvas.width / 2, y + (lineHeight / 2) + (fontSize / 3));

            // 绘制文字
            ctx.fillStyle = textColor;
            ctx.fillText(line, canvas.width / 2, y + (lineHeight / 2) + (fontSize / 3));
        });

        // 绘制水印
        const watermarkText = document.getElementById('watermarkText').value || '图片字幕生成器';
        const watermarkOpacity = parseFloat(document.getElementById('watermarkOpacity').value) || 0.3;
        const watermarkStyle = document.getElementById('watermarkStyle').value;
        const watermarkSize = parseInt(document.getElementById('watermarkSize').value);
        
        ctx.save();
        ctx.globalAlpha = watermarkOpacity;
        ctx.font = `${watermarkSize}px Arial`;
        ctx.fillStyle = document.getElementById('watermarkColor').value;
        
        const textWidth = ctx.measureText(watermarkText).width;
        const padding = 20;

        switch (watermarkStyle) {
            case 'full':
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(-Math.PI / 6);
                const pattern = {
                    width: textWidth + 50,
                    height: watermarkSize + 10
                };
                for (let x = -canvas.width; x < canvas.width; x += pattern.width) {
                    for (let y = -canvas.height; y < canvas.height; y += pattern.height) {
                        ctx.fillText(watermarkText, x, y);
                    }
                }
                break;

            case 'top-right':
                ctx.textAlign = 'right';
                ctx.fillText(watermarkText, canvas.width - padding, watermarkSize + padding);
                break;

            case 'bottom-right':
                ctx.textAlign = 'right';
                ctx.fillText(watermarkText, canvas.width - padding, canvas.height - padding);
                break;

            case 'center':
                ctx.textAlign = 'center';
                ctx.fillText(watermarkText, canvas.width / 2, canvas.height / 2);
                break;
        }
        
        ctx.restore();
    };
});