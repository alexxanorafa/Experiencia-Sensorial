// ===== CONFIGURAÇÃO INICIAL =====
class IntervaloLuz {
  constructor() {
    // Estado Global
    this.estado = {
      caminho: 'luz',
      humor: 'silencio',
      fragmentoAtual: 0,
      fragmentosDescobertos: new Set(),
      memoria: JSON.parse(localStorage.getItem('intervaloLuz_memoria') || '[]'),
      inicioSessao: Date.now(),
      ultimaInteracao: Date.now(),
      velocidade: 0,
      modoImersao: false
    };
    
    // Elementos DOM
    this.elementos = {};
    this.audio = {};
    
    // Sistemas
    this.particulas = new SistemaParticulas();
    this.audioSystem = new SistemaAudio();
    this.exportador = new SistemaExportacao(this);
    
    // Inicialização
    this.inicializarDOM();
    this.inicializarEventos();
    this.inicializarSistemas();
    this.carregarProjetos();
    this.atualizarInterface();
    
    // Loop principal
    this.loop();
  }
  
  inicializarDOM() {
    // Mapear elementos principais
    this.elementos = {
      // Controles
      controlesCaminho: document.getElementById('controlesCaminho'),
      controlesEstado: document.getElementById('controlesEstado'),
      btnCiclo: document.getElementById('btnCiclo'),
      btnImersao: document.getElementById('btnImersao'),
      menuToggle: document.getElementById('menuToggle'),
      menuOverlay: document.getElementById('menuOverlay'),
      btnExportar: document.getElementById('btnExportar'),
      btnFecharMemoria: document.getElementById('btnFecharMemoria'),
      painelMemoria: document.getElementById('painelMemoria'),
      
      // Cena
      cenaPrincipal: document.getElementById('cenaPrincipal'),
      nucleoCentral: document.getElementById('nucleoCentral'),
      orbitaExterna: document.getElementById('orbitaExterna'),
      orbitaInterna: document.getElementById('orbitaInterna'),
      fragmento1: document.getElementById('fragmento1'),
      fragmento2: document.getElementById('fragmento2'),
      fragmento3: document.getElementById('fragmento3'),
      haloLuz: document.getElementById('haloLuz'),
      
      // Oráculo
      oraculoTexto: document.getElementById('oraculoTexto'),
      indicadorVelocidade: document.getElementById('indicadorVelocidade'),
      indicadorTexto: document.getElementById('indicadorTexto'),
      
      // Pontos de interação
      pontosInteracao: document.querySelectorAll('.ponto-interacao'),
      
      // Memória
      memoriaConteudo: document.getElementById('memoriaConteudo'),
      contadorFragmentos: document.getElementById('contadorFragmentos'),
      tempoSessao: document.getElementById('tempoSessao'),
      
      // Modal
      modalExportar: document.getElementById('modalExportar'),
      previewExportacao: document.getElementById('previewExportacao'),
      projetosGrid: document.getElementById('projetosGrid')
    };
    
    // Áudio
    this.audio.ambiente = document.getElementById('audioAmbiente');
    this.audio.interacao = document.getElementById('audioInteracao');
  }
  
  inicializarEventos() {
    // Controles de caminho
    this.elementos.controlesCaminho.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-caminho]');
      if (!btn) return;
      
      const caminho = btn.dataset.caminho;
      this.mudarCaminho(caminho);
      this.registrarInteracao();
    });
    
    // Controles de estado
    this.elementos.controlesEstado.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-estado]');
      if (!btn) return;
      
      const estado = btn.dataset.estado;
      this.mudarEstado(estado);
      this.registrarInteracao();
    });
    
    // Botão de ciclo
    this.elementos.btnCiclo.addEventListener('click', () => {
      this.cicloFragmentos();
      this.registrarInteracao();
    });
    
    // Botão de imersão
    this.elementos.btnImersao.addEventListener('click', () => {
      this.toggleModoImersao();
      this.registrarInteracao();
    });
    
    // Menu toggle
    this.elementos.menuToggle.addEventListener('click', () => {
      this.toggleMenu();
      this.registrarInteracao();
    });
    
    // Botão exportar
    this.elementos.btnExportar.addEventListener('click', () => {
      this.abrirModalExportacao();
      this.registrarInteracao();
    });
    
    // Botão fechar memória
    this.elementos.btnFecharMemoria.addEventListener('click', () => {
      this.elementos.painelMemoria.classList.remove('ativo');
    });
    
    // Pontos de interação
    this.elementos.pontosInteracao.forEach(ponto => {
      ponto.addEventListener('click', () => {
        this.descobrirFragmento(ponto.dataset.secreto);
        this.registrarInteracao();
      });
    });
    
    // Interação com a cena
    this.elementos.cenaPrincipal.addEventListener('mousemove', (e) => {
      this.atualizarParallax(e);
      this.calcularVelocidade(e);
      this.registrarInteracao();
    });
    
    this.elementos.cenaPrincipal.addEventListener('mouseleave', () => {
      this.resetarParallax();
    });
    
    // Fechar modal ao clicar fora
    this.elementos.modalExportar.addEventListener('click', (e) => {
      if (e.target === this.elementos.modalExportar) {
        this.fecharModalExportacao();
      }
    });
    
    // Opções de exportação
    document.querySelectorAll('.btn-exportar-opcao').forEach(btn => {
      btn.addEventListener('click', () => {
        this.exportar(btn.dataset.tipo);
      });
    });
    
    // Botão fechar modal
    document.querySelector('.btn-fechar-modal').addEventListener('click', () => {
      this.fecharModalExportacao();
    });
    
    // Teclado
    document.addEventListener('keydown', (e) => {
      this.manipularTeclado(e);
    });
    
    // Resize
    window.addEventListener('resize', () => {
      this.particulas.redimensionar();
    });
  }
  
  inicializarSistemas() {
    // Iniciar partículas
    this.particulas.inicializar('particleCanvas');
    
    // Iniciar áudio
    this.audioSystem.inicializar(this.audio);
    
    // Carregar fragmentos da memória
    this.carregarMemoria();
  }
  
  // ===== GERENCIAMENTO DE ESTADO =====
  mudarCaminho(caminho) {
    this.estado.caminho = caminho;
    document.body.setAttribute('data-caminho', caminho);
    this.elementos.cenaPrincipal.style.background = this.obterGradiente(caminho);
    
    // Atualizar botões ativos
    document.querySelectorAll('[data-caminho]').forEach(btn => {
      btn.classList.toggle('ativo', btn.dataset.caminho === caminho);
      btn.setAttribute('aria-pressed', btn.dataset.caminho === caminho);
    });
    
    // Atualizar fragmentos
    this.carregarFragmentos();
    this.audioSystem.alterarAmbiente(caminho);
  }
  
  mudarEstado(estado) {
    this.estado.humor = estado;
    document.body.setAttribute('data-estado', estado);
    
    // Atualizar botões ativos
    document.querySelectorAll('[data-estado]').forEach(btn => {
      btn.classList.toggle('ativo', btn.dataset.estado === estado);
      btn.setAttribute('aria-pressed', btn.dataset.estado === estado);
    });
    
    // Efeitos visuais
    this.atualizarEfeitosVisuais();
  }
  
  toggleModoImersao() {
    this.estado.modoImersao = !this.estado.modoImersao;
    document.body.classList.toggle('modo-imersao', this.estado.modoImersao);
    
    if (this.estado.modoImersao) {
      document.documentElement.requestFullscreen();
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }
  
  toggleMenu() {
    const aberto = this.elementos.menuOverlay.classList.toggle('ativo');
    this.elementos.menuToggle.setAttribute('aria-expanded', aberto);
    this.elementos.menuToggle.classList.toggle('ativo', aberto);
    
    // Pausar interações da cena quando menu aberto
    if (aberto) {
      this.elementos.cenaPrincipal.style.pointerEvents = 'none';
    } else {
      setTimeout(() => {
        this.elementos.cenaPrincipal.style.pointerEvents = 'auto';
      }, 400);
    }
  }
  
  // ===== FRAGMENTOS E MEMÓRIA =====
  fragmentos = {
    luz: [
      ["Uma curva de luz ensaia o gesto de existir, roçando o ponto onde o escuro começa a escutar.",
       "Há um brilho que não reclama lugar: apenas inclina o silêncio noutra direção.",
       "Entre a sombra que guarda e o dourado que se insinua, algo testa a forma de um quase."],
      ["Nada toca o centro, mas o centro já não é o mesmo.",
       "O ar aprende outra órbita sem saber quando começou a girar.",
       "Na superfície, é cor. No fundo, é um modo diferente de respirar."],
      ["O contorno mantém-se, mas a intenção inclina-se.",
       "O escuro não recua: reorganiza-se.",
       "A luz não chega: deixa-se adivinhar."]
    ],
    sombra: [
      ["A penumbra dobra-se sobre si mesma, como se escondesse uma lembrança que ainda não aceita nome.",
       "Há zonas onde a luz não entra: não por recusa, mas por respeito.",
       "Entre o que se vê e o que se pressente, o preto aprende novas profundidades."],
      ["O contorno do silêncio é mais nítido do que qualquer linha.",
       "Há um peso suave no ar, como se as histórias não contadas tivessem ganho densidade.",
       "Na ausência de brilho, pequenos movimentos tornam-se evidentes."],
      ["O escuro não é fim: é intervalo entre formas.",
       "Há detalhes que só a penumbra sabe revelar.",
       "Aquilo que não aparece ainda assim influencia tudo o que se move aqui."]
    ],
    intervalo: [
      ["Nada começa, nada termina: tudo oscila num território de quase.",
       "A forma parece prestes a escolher um lado, mas prefere o limiar.",
       "O espaço entre um gesto e o seguinte ganha espessura."],
      ["O tempo estica-se discretamente, como se quisesse caber em mais possibilidades.",
       "Nem avanço nem recuo: apenas suspensão.",
       "A imagem não decide se é ascensão ou curva de regresso."],
      ["Um centro invisível organiza o que parece disperso.",
       "O que ainda não aconteceu já influencia o que se sente.",
       "O intervalo é o lugar onde a intenção experimenta corpo."]
    ]
  };
  
  fragmentosSecretos = {
    1: ["Quando a luz hesita, não é fraqueza: é escuta.",
        "Algumas verdades precisam de roçar o contorno antes de se deixarem ver.",
        "Há gestos que só fazem sentido depois do atraso."],
    2: ["Nem toda a sombra é recuo: às vezes é abrigo.",
        "O que se cala também escreve a paisagem.",
        "Há silêncios que afinam o ouvido para o que ainda não nasceu."],
    3: ["Entre o impulso e o ato, um campo inteiro reorganiza o destino.",
        "O quase também é uma forma de chegar.",
        "Há encontros que só existem enquanto hipótese – e, ainda assim, tocam."],
    4: ["Na pausa entre dois pensamentos, o universo respira.",
        "O que não é dito ressoa mais fundo que qualquer palavra.",
        "Entre o visto e o imaginado, habita toda a possibilidade."]
  };
  
  mensagensOraculo = {
    lento: ["O gesto lento permite que o campo te responda com precisão.",
            "Quando abrandas, a imagem começa a lembrar-se de outros contornos.",
            "Ritmos suaves abrem camadas que a pressa não vê."],
    medio: ["O movimento mede a distância entre o que já sabes e o que ainda exploras.",
            "A curva acompanha o teu passo: nem à frente, nem atrás.",
            "Há uma conversa discreta entre a tua velocidade e a forma que te observa."],
    rapido: ["A pressa dobra a luz em ângulos inesperados.",
             "O campo quase perde o rasto, mas ganha intensidade.",
             "Algumas buscas precisam de excesso antes de encontrarem direção."],
    pausa: ["Quando te calas, o cenário continua a reorganizar-se à tua volta.",
            "A imobilidade também é um tipo de pergunta.",
            "Às vezes, o não gesto é o ponto mais nítido da curva."]
  };
  
  carregarFragmentos() {
    const fragmentos = this.fragmentos[this.estado.caminho] || this.fragmentos.luz;
    const conjunto = fragmentos[this.estado.fragmentoAtual % fragmentos.length];
    
    const elementos = [
      this.elementos.fragmento1,
      this.elementos.fragmento2,
      this.elementos.fragmento3
    ];
    
    elementos.forEach((el, i) => {
      if (conjunto[i]) {
        el.textContent = conjunto[i];
        el.classList.add('ativo');
        
        // Animação de entrada
        setTimeout(() => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, 100 * i);
      }
    });
    
    this.audioSystem.tocarInteracao();
  }
  
  cicloFragmentos() {
    this.estado.fragmentoAtual++;
    this.carregarFragmentos();
    this.particulas.emitirExplosao(400, 400, 15);
  }
  
  descobrirFragmento(id) {
    if (this.estado.fragmentosDescobertos.has(id)) return;
    
    const fragmentos = this.fragmentosSecretos[id];
    if (!fragmentos) return;
    
    const fragmento = fragmentos[Math.floor(Math.random() * fragmentos.length)];
    this.estado.fragmentosDescobertos.add(id);
    
    // Mostrar no oráculo
    this.elementos.oraculoTexto.textContent = fragmento;
    
    // Marcar como descoberto
    const ponto = document.querySelector(`[data-secreto="${id}"]`);
    if (ponto) {
      ponto.classList.add('descoberto');
      ponto.setAttribute('aria-label', `Fragmento ${id} descoberto`);
    }
    
    // Adicionar à memória
    this.adicionarMemoria(fragmento, 'secreto');
    
    // Efeitos
    this.audioSystem.tocarDescoberta();
    this.particulas.emitirExplosao(
      ponto.getBoundingClientRect().left + 20,
      ponto.getBoundingClientRect().top + 20,
      30
    );
    
    this.atualizarInterface();
  }
  
  adicionarMemoria(texto, tipo) {
    const item = {
      id: Date.now(),
      texto,
      tipo,
      caminho: this.estado.caminho,
      humor: this.estado.humor,
      timestamp: new Date().toISOString()
    };
    
    this.estado.memoria.unshift(item);
    if (this.estado.memoria.length > 50) {
      this.estado.memoria = this.estado.memoria.slice(0, 50);
    }
    
    localStorage.setItem('intervaloLuz_memoria', JSON.stringify(this.estado.memoria));
    this.carregarMemoria();
  }
  
  carregarMemoria() {
    const container = this.elementos.memoriaConteudo;
    
    if (this.estado.memoria.length === 0) {
      container.innerHTML = '<p class="memoria-vazia">Os fragmentos que guardares aparecerão aqui.</p>';
      return;
    }
    
    container.innerHTML = this.estado.memoria.map(item => `
      <div class="fragmento-salvo" data-tipo="${item.tipo}">
        <p>${item.texto}</p>
        <div class="fragmento-metadata">
          <span>${this.formatarCaminho(item.caminho)}</span>
          <span>${new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
      </div>
    `).join('');
  }
  
  formatarCaminho(caminho) {
    const map = {
      luz: '◉ Luz',
      sombra: '◎ Sombra',
      intervalo: '⦾ Intervalo'
    };
    return map[caminho] || caminho;
  }
  
  // ===== SISTEMA DE PARALLAX =====
  atualizarParallax(evento) {
    const rect = this.elementos.cenaPrincipal.getBoundingClientRect();
    const x = (evento.clientX - rect.left) / rect.width - 0.5;
    const y = (evento.clientY - rect.top) / rect.height - 0.5;
    
    // Atualizar camada de fundo
    document.documentElement.style.setProperty('--mouse-x', `${(x + 0.5) * 100}%`);
    document.documentElement.style.setProperty('--mouse-y', `${(y + 0.5) * 100}%`);
    
    // Movimentar núcleo
    const offsetX = x * 20;
    const offsetY = y * 20;
    this.elementos.nucleoCentral.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
    
    // Movimentar órbitas
    const orbitaOffsetX = x * -30;
    const orbitaOffsetY = y * 15;
    this.elementos.orbitaExterna.style.transform = `translate(${orbitaOffsetX}px, ${orbitaOffsetY}px)`;
    this.elementos.orbitaInterna.style.transform = `translate(${orbitaOffsetX * 0.7}px, ${orbitaOffsetY * 0.7}px)`;
    
    // Atualizar partículas
    this.particulas.atualizarForca(x * 0.2, y * 0.2);
  }
  
  resetarParallax() {
    this.elementos.nucleoCentral.style.transform = 'translate(-50%, -50%)';
    this.elementos.orbitaExterna.style.transform = 'translate(0, 0)';
    this.elementos.orbitaInterna.style.transform = 'translate(0, 0)';
    this.particulas.atualizarForca(0, 0);
  }
  
  // ===== SISTEMA DE VELOCIDADE =====
  calcularVelocidade(evento) {
    const agora = Date.now();
    const deltaT = (agora - this.estado.ultimaInteracao) / 1000;
    
    if (this.ultimaPosicao && deltaT > 0) {
      const deltaX = evento.clientX - this.ultimaPosicao.x;
      const deltaY = evento.clientY - this.ultimaPosicao.y;
      const distancia = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      this.estado.velocidade = distancia / deltaT / 1000; // Normalizada
      this.atualizarOraculo();
    }
    
    this.ultimaPosicao = { x: evento.clientX, y: evento.clientY };
    this.estado.ultimaInteracao = agora;
  }
  
  atualizarOraculo() {
    let categoria = 'medio';
    let textoIndicador = 'médio';
    
    if (this.estado.velocidade < 0.01) {
      categoria = 'pausa';
      textoIndicador = 'pausa';
    } else if (this.estado.velocidade < 0.05) {
      categoria = 'lento';
      textoIndicador = 'lento';
    } else if (this.estado.velocidade > 0.15) {
      categoria = 'rapido';
      textoIndicador = 'rápido';
    }
    
    // Atualizar indicador visual
    const porcentagem = Math.min(this.estado.velocidade * 500, 100);
    this.elementos.indicadorVelocidade.style.setProperty('--velocidade', `${porcentagem}%`);
    this.elementos.indicadorTexto.textContent = textoIndicador;
    
    // Atualizar texto do oráculo ocasionalmente
    if (Math.random() < 0.02) {
      const mensagens = this.mensagensOraculo[categoria];
      if (mensagens) {
        const mensagem = mensagens[Math.floor(Math.random() * mensagens.length)];
        this.elementos.oraculoTexto.textContent = mensagem;
      }
    }
  }
  
  // ===== EFEITOS VISUAIS =====
  atualizarEfeitosVisuais() {
    switch(this.estado.humor) {
      case 'silencio':
        this.elementos.haloLuz.style.opacity = '0.5';
        this.elementos.cenaPrincipal.style.filter = 'saturate(0.9)';
        break;
      case 'fluxo':
        this.elementos.haloLuz.style.opacity = '0.8';
        this.elementos.cenaPrincipal.style.filter = 'saturate(1.1)';
        break;
      case 'intensidade':
        this.elementos.haloLuz.style.opacity = '1';
        this.elementos.cenaPrincipal.style.filter = 'saturate(1.3) contrast(1.1)';
        break;
    }
  }
  
  obterGradiente(caminho) {
    const gradientes = {
      luz: 'radial-gradient(circle at 10% 0%, #2b1634 0%, #06010a 55%, #000 100%)',
      sombra: 'radial-gradient(circle at 0% 100%, #100818 0%, #020105 55%, #000 100%)',
      intervalo: 'radial-gradient(circle at 50% 0%, #24142e 0%, #05020b 55%, #000 100%)'
    };
    return gradientes[caminho] || gradientes.luz;
  }
  
  // ===== SISTEMA DE PROJETOS =====
  async carregarProjetos() {
    const projetos = [
      {
        titulo: "Alquimia dos Sentimentos",
        url: "https://alexxanorafa.github.io/Alquimia-dos-Sentimentos/",
        descricao: "Transformação emocional através de elementos alquímicos."
      },
      {
        titulo: "Almas Conectadas",
        url: "https://alexxanorafa.github.io/Almas-Conectadas/",
        descricao: "Exploração das conexões entre almas gêmeas."
      },
      {
        titulo: "Anéis da Sabedoria",
        url: "https://alexxanorafa.github.io/Aneis_da_Sabedoria/",
        descricao: "Sabedoria ancestral em forma de anéis interativos."
      },
      // Adicione mais projetos conforme necessário
    ];
    
    const grid = this.elementos.projetosGrid;
    grid.innerHTML = projetos.map(projeto => `
      <a href="${projeto.url}" target="_blank" rel="noopener" class="projeto-card">
        <h3>${projeto.titulo}</h3>
        <p>${projeto.descricao}</p>
      </a>
    `).join('');
  }
  
  // ===== SISTEMA DE EXPORTAÇÃO =====
  abrirModalExportacao() {
    this.elementos.modalExportar.classList.add('ativo');
    this.elementos.previewExportacao.innerHTML = `
      <div>
        <p>Escolha o formato para exportar sua jornada.</p>
        <p class="texto-sutil">${this.estado.memoria.length} fragmentos na memória</p>
      </div>
    `;
  }
  
  fecharModalExportacao() {
    this.elementos.modalExportar.classList.remove('ativo');
  }
  
  async exportar(tipo) {
    switch(tipo) {
      case 'imagem':
        await this.exportador.exportarImagem();
        break;
      case 'texto':
        this.exportador.exportarTexto();
        break;
      case 'constelacao':
        this.exportador.exportarConstelacao();
        break;
    }
    
    this.fecharModalExportacao();
  }
  
  // ===== ATUALIZAÇÃO DA INTERFACE =====
  atualizarInterface() {
    // Contador de fragmentos
    this.elementos.contadorFragmentos.textContent = 
      `${this.estado.fragmentosDescobertos.size} fragmentos descobertos`;
    
    // Tempo de sessão
    const minutos = Math.floor((Date.now() - this.estado.inicioSessao) / 60000);
    this.elementos.tempoSessao.textContent = 
      minutos === 0 ? 'há poucos segundos' : `há ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
    
    // Mostrar/ocultar painel de memória
    if (this.estado.memoria.length > 0 && !this.elementos.painelMemoria.classList.contains('ativo')) {
      setTimeout(() => {
        this.elementos.painelMemoria.classList.add('ativo');
      }, 2000);
    }
  }
  
  // ===== CONTROLE POR TECLADO =====
  manipularTeclado(evento) {
    // Não interferir com inputs
    if (evento.target.tagName === 'INPUT' || evento.target.tagName === 'TEXTAREA') return;
    
    switch(evento.key) {
      case 'ArrowLeft':
        evento.preventDefault();
        this.cicloFragmentos();
        break;
      case ' ':
      case 'Spacebar':
        evento.preventDefault();
        this.cicloFragmentos();
        break;
      case 'Escape':
        if (this.elementos.menuOverlay.classList.contains('ativo')) {
          this.toggleMenu();
        } else if (this.elementos.modalExportar.classList.contains('ativo')) {
          this.fecharModalExportacao();
        } else if (this.estado.modoImersao) {
          this.toggleModoImersao();
        }
        break;
      case 'm':
      case 'M':
        evento.preventDefault();
        this.elementos.painelMemoria.classList.toggle('ativo');
        break;
      case 'i':
      case 'I':
        evento.preventDefault();
        this.toggleModoImersao();
        break;
    }
  }
  
  // ===== REGISTRO DE INTERAÇÃO =====
  registrarInteracao() {
    this.estado.ultimaInteracao = Date.now();
  }
  
  // ===== LOOP PRINCIPAL =====
  loop() {
    // Atualizar partículas
    this.particulas.animar();
    
    // Atualizar interface
    requestAnimationFrame(() => this.loop());
    
    // Verificar inatividade
    const tempoInativo = Date.now() - this.estado.ultimaInteracao;
    if (tempoInativo > 10000 && Math.random() < 0.01) {
      const mensagens = this.mensagensOraculo.pausa;
      this.elementos.oraculoTexto.textContent = 
        mensagens[Math.floor(Math.random() * mensagens.length)];
    }
  }
}

// ===== SISTEMA DE PARTÍCULAS =====
class SistemaParticulas {
  constructor() {
    this.particulas = [];
    this.contexto = null;
    this.largura = 0;
    this.altura = 0;
    this.forcaX = 0;
    this.forcaY = 0;
  }
  
  inicializar(idCanvas) {
    const canvas = document.getElementById(idCanvas);
    if (!canvas) return;
    
    this.contexto = canvas.getContext('2d');
    this.redimensionar();
    
    // Criar partículas iniciais
    for (let i = 0; i < 100; i++) {
      this.particulas.push(this.criarParticula());
    }
  }
  
  redimensionar() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    
    this.largura = canvas.width = window.innerWidth;
    this.altura = canvas.height = window.innerHeight;
  }
  
  criarParticula() {
    return {
      x: Math.random() * this.largura,
      y: Math.random() * this.altura,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      raio: Math.random() * 2 + 0.5,
      cor: Math.random() > 0.5 ? '#f9c55a' : '#b1363c',
      opacidade: Math.random() * 0.5 + 0.1,
      vida: 1,
      decaimento: Math.random() * 0.002 + 0.001
    };
  }
  
  atualizarForca(x, y) {
    this.forcaX = x;
    this.forcaY = y;
  }
  
  emitirExplosao(x, y, quantidade) {
    for (let i = 0; i < quantidade; i++) {
      this.particulas.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        raio: Math.random() * 3 + 1,
        cor: Math.random() > 0.3 ? '#f9c55a' : '#b1363c',
        opacidade: Math.random() * 0.8 + 0.2,
        vida: 1,
        decaimento: Math.random() * 0.02 + 0.01
      });
    }
  }
  
  animar() {
    if (!this.contexto) return;
    
    // Limpar canvas com fade
    this.contexto.fillStyle = 'rgba(5, 3, 8, 0.05)';
    this.contexto.fillRect(0, 0, this.largura, this.altura);
    
    // Atualizar e desenhar partículas
    for (let i = this.particulas.length - 1; i >= 0; i--) {
      const p = this.particulas[i];
      
      // Aplicar força
      p.vx = p.vx * 0.99 + this.forcaX * 0.1;
      p.vy = p.vy * 0.99 + this.forcaY * 0.1;
      
      // Atualizar posição
      p.x += p.vx;
      p.y += p.vy;
      
      // Decaimento
      p.vida -= p.decaimento;
      
      // Remover partículas mortas
      if (p.vida <= 0 || 
          p.x < -100 || p.x > this.largura + 100 || 
          p.y < -100 || p.y > this.altura + 100) {
        this.particulas.splice(i, 1);
        continue;
      }
      
      // Desenhar partícula
      this.contexto.beginPath();
      this.contexto.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
      this.contexto.fillStyle = p.cor.replace(')', `, ${p.opacidade * p.vida})`).replace('rgb', 'rgba');
      this.contexto.fill();
      
      // Adicionar brilho
      this.contexto.beginPath();
      this.contexto.arc(p.x, p.y, p.raio * 2, 0, Math.PI * 2);
      const gradiente = this.contexto.createRadialGradient(
        p.x, p.y, 0,
        p.x, p.y, p.raio * 2
      );
      gradiente.addColorStop(0, p.cor.replace(')', `, ${0.3 * p.vida})`).replace('rgb', 'rgba'));
      gradiente.addColorStop(1, p.cor.replace(')', `, 0)`).replace('rgb', 'rgba'));
      this.contexto.fillStyle = gradiente;
      this.contexto.fill();
    }
    
    // Manter número mínimo de partículas
    while (this.particulas.length < 50) {
      this.particulas.push(this.criarParticula());
    }
  }
}

// ===== SISTEMA DE ÁUDIO =====
class SistemaAudio {
  inicializar(elementosAudio) {
    this.audio = elementosAudio;
    
    // Configurar volume inicial
    this.audio.ambiente.volume = 0.3;
    this.audio.interacao.volume = 0.5;
    
    // Iniciar áudio ambiente
    this.audio.ambiente.play().catch(e => console.log('Áudio aguardando interação do usuário'));
  }
  
  alterarAmbiente(caminho) {
    // Alterar pitch baseado no caminho
    const pitches = {
      luz: 1.0,
      sombra: 0.8,
      intervalo: 1.2
    };
    
    this.audio.ambiente.playbackRate = pitches[caminho] || 1.0;
  }
  
  tocarInteracao() {
    this.audio.interacao.currentTime = 0;
    this.audio.interacao.play().catch(e => console.log('Erro ao tocar áudio'));
  }
  
  tocarDescoberta() {
    // Tocar áudio de descoberta (pode ser o mesmo para simplicidade)
    this.audio.interacao.currentTime = 0.2;
    this.audio.interacao.playbackRate = 1.5;
    this.audio.interacao.play().catch(e => console.log('Erro ao tocar áudio'));
    
    // Resetar playback rate
    setTimeout(() => {
      this.audio.interacao.playbackRate = 1.0;
    }, 300);
  }
}

// ===== SISTEMA DE EXPORTAÇÃO =====
class SistemaExportacao {
  constructor(app) {
    this.app = app;
  }
  
  async exportarImagem() {
    try {
      // Usar html2canvas se disponível, ou método alternativo
      if (typeof html2canvas !== 'undefined') {
        const canvas = await html2canvas(this.app.elementos.cenaPrincipal, {
          backgroundColor: null,
          scale: 2,
          useCORS: true
        });
        
        const link = document.createElement('a');
        link.download = `intervalo-de-luz-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        // Método alternativo simples
        this.downloadURL(this.app.elementos.cenaPrincipal.toDataURL(), `intervalo-de-luz-${Date.now()}.png`);
      }
    } catch (erro) {
      console.error('Erro ao exportar imagem:', erro);
      alert('Não foi possível exportar a imagem. Tente novamente.');
    }
  }
  
  exportarTexto() {
    const texto = this.app.estado.memoria
      .map(item => `[${new Date(item.timestamp).toLocaleString()}] ${item.texto}`)
      .join('\n\n');
    
    const blob = new Blob([texto], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = `minha-jornada-${Date.now()}.txt`;
    link.href = URL.createObjectURL(blob);
    link.click();
    
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  }
  
  exportarConstelacao() {
    // Criar um SVG simples com os fragmentos como estrelas
    const svg = `
      <svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bg">
            <stop offset="0%" stop-color="#050308"/>
            <stop offset="100%" stop-color="#130814"/>
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <rect width="800" height="600" fill="url(#bg)"/>
        
        ${this.app.estado.memoria.map((item, i) => {
          const angle = (i / this.app.estado.memoria.length) * Math.PI * 2;
          const x = 400 + Math.cos(angle) * 200;
          const y = 300 + Math.sin(angle) * 200;
          
          return `
            <circle cx="${x}" cy="${y}" r="3" fill="#f9c55a" filter="url(#glow)"/>
            <text x="${x + 10}" y="${y}" fill="#f3e8da" font-size="12" font-family="Arial">
              ${item.texto.substring(0, 30)}...
            </text>
          `;
        }).join('')}
        
        <text x="400" y="550" text-anchor="middle" fill="#f9c55a" font-size="20" font-family="Arial">
          Intervalo de Luz - ${new Date().toLocaleDateString()}
        </text>
      </svg>
    `;
    
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = `constelacao-${Date.now()}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  }
  
  downloadURL(url, nome) {
    const link = document.createElement('a');
    link.href = url;
    link.download = nome;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// ===== INICIALIZAÇÃO DA APLICAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
  // Iniciar aplicação
  window.app = new IntervaloLuz();
  
  // Solicitar permissão para áudio
  document.addEventListener('click', () => {
    if (window.app.audio.ambiente.paused) {
      window.app.audio.ambiente.play().catch(e => console.log('Áudio iniciado'));
    }
  }, { once: true });
  
  // Notificação de boas-vindas
  setTimeout(() => {
    if (window.app.estado.memoria.length === 0) {
      window.app.elementos.oraculoTexto.textContent = 
        "Bem-vindo ao Intervalo de Luz. Movimente o cursor para começar.";
    }
  }, 1000);
});

// ===== POLYFILLS E COMPATIBILIDADE =====
// Suporte a requestFullscreen
if (!Document.prototype.requestFullscreen) {
  Document.prototype.requestFullscreen = 
    Document.prototype.webkitRequestFullscreen || 
    Document.prototype.msRequestFullscreen;
}

if (!Document.prototype.exitFullscreen) {
  Document.prototype.exitFullscreen = 
    Document.prototype.webkitExitFullscreen || 
    Document.prototype.msExitFullscreen;
}

// Detectar mudanças no fullscreen
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    window.app.estado.modoImersao = false;
    document.body.classList.remove('modo-imersao');
  }
});