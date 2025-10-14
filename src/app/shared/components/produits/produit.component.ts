import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Produit {
  id: number;
  nom: string;
  prix: string;
  quantiteMin: string;
  imageUrl: string;
  fournisseur: string;
  verified?: boolean;
  pays?: string;
  annee?: number;
}

@Component({
  selector: 'app-produits',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './produit.component.html',
  styleUrls: ['./produit.component.scss'],
})
export class ProduitsComponent implements OnInit {
  produits: Produit[] = [];

  ngOnInit() {
    // ⚙️ Simulation de données (tu pourras remplacer par un appel API)
    this.produits = [
      {
        id: 1,
        nom: 'Lunettes de soleil polarisées',
        prix: '5 924 - 6 813 F CFA',
        quantiteMin: '10 pièces',
        imageUrl:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        fournisseur: 'Danyang Pinhui Optics',
        verified: true,
        pays: 'CN',
        annee: 8,
      },
      {
        id: 2,
        nom: 'Sinotruck 10 roues 40 tonnes',
        prix: '2 369 469 - 3 850 387 F CFA',
        quantiteMin: '1 unité',
        imageUrl:
          'https://images.unsplash.com/photo-1593941707874-ef25b8b4a92c?auto=format&fit=crop&w=400&q=80',
        fournisseur: 'Jiangxi Weierke',
        verified: true,
        pays: 'CN',
        annee: 2,
      },
      {
        id: 3,
        nom: 'Sacs à dos imperméables 2025',
        prix: '12 000 - 18 000 F CFA',
        quantiteMin: '50 pièces',
        imageUrl:
          'https://images.unsplash.com/photo-1598032895144-36d8c72e0c8b?auto=format&fit=crop&w=400&q=80',
        fournisseur: 'Shenzhen Bags Ltd',
        verified: false,
        pays: 'CN',
        annee: 5,
      },
       {
        id: 3,
        nom: 'Sacs à dos imperméables 2025',
        prix: '12 000 - 18 000 F CFA',
        quantiteMin: '50 pièces',
        imageUrl:
          'https://images.unsplash.com/photo-1598032895144-36d8c72e0c8b?auto=format&fit=crop&w=400&q=80',
        fournisseur: 'Shenzhen Bags Ltd',
        verified: false,
        pays: 'CN',
        annee: 5,
      }, {
        id: 3,
        nom: 'Sacs à dos imperméables 2025',
        prix: '12 000 - 18 000 F CFA',
        quantiteMin: '50 pièces',
        imageUrl:
          'https://images.unsplash.com/photo-1598032895144-36d8c72e0c8b?auto=format&fit=crop&w=400&q=80',
        fournisseur: 'Shenzhen Bags Ltd',
        verified: false,
        pays: 'CN',
        annee: 5,
      }, {
        id: 3,
        nom: 'Sacs à dos imperméables 2025',
        prix: '12 000 - 18 000 F CFA',
        quantiteMin: '50 pièces',
        imageUrl:
          'https://images.unsplash.com/photo-1598032895144-36d8c72e0c8b?auto=format&fit=crop&w=400&q=80',
        fournisseur: 'Shenzhen Bags Ltd',
        verified: false,
        pays: 'CN',
        annee: 5,
      }, {
        id: 3,
        nom: 'Sacs à dos imperméables 2025',
        prix: '12 000 - 18 000 F CFA',
        quantiteMin: '50 pièces',
        imageUrl:
          'https://images.unsplash.com/photo-1598032895144-36d8c72e0c8b?auto=format&fit=crop&w=400&q=80',
        fournisseur: 'Shenzhen Bags Ltd',
        verified: false,
        pays: 'CN',
        annee: 5,
      }, {
        id: 3,
        nom: 'Sacs à dos imperméables 2025',
        prix: '12 000 - 18 000 F CFA',
        quantiteMin: '50 pièces',
        imageUrl:
          'https://images.unsplash.com/photo-1598032895144-36d8c72e0c8b?auto=format&fit=crop&w=400&q=80',
        fournisseur: 'Shenzhen Bags Ltd',
        verified: false,
        pays: 'CN',
        annee: 5,
      },
    ];
  }
}
