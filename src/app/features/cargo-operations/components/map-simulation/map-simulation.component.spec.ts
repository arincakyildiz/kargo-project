import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapSimulationComponent } from './map-simulation.component';
import { ShipmentService } from '../../services/shipment.service';
import { ZoneService } from '../../services/zone.service';
import { CourierService } from '../../services/courier.service';

describe('MapSimulationComponent', () => {
  let component: MapSimulationComponent;
  let fixture: ComponentFixture<MapSimulationComponent>;
  let zoneService: ZoneService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MapSimulationComponent],
      providers: [ShipmentService, ZoneService, CourierService]
    }).compileComponents();

    fixture = TestBed.createComponent(MapSimulationComponent);
    component = fixture.componentInstance;
    zoneService = TestBed.inject(ZoneService);

    // Load demo data
    zoneService.ornekVeriYukle();
    fixture.detectChanges();
  });

  it('bileşen başarıyla başlatılır', () => {
    expect(component).toBeTruthy();
  });

  it('aktif bölge düğümlerini listeler', () => {
    const dugumler = component.bolgeDugumleri();
    expect(dugumler.length).toBeGreaterThan(0);
    // Nilüfer pasif olmalı, diğerleri aktif
    const nilufer = dugumler.find(d => d.ad === 'Nilüfer');
    expect(nilufer?.aktifMi).toBeFalse();
    const kadikoy = dugumler.find(d => d.ad === 'Kadıköy');
    expect(kadikoy?.aktifMi).toBeTrue();
  });

  it('düğüm seçildiğinde seciliBolgeDegisti olayını tetikler', () => {
    spyOn(component.seciliBolgeDegisti, 'emit');
    component.dugumSec('zon-1');
    expect(component.seciliBolgeDegisti.emit).toHaveBeenCalledWith('zon-1');
  });

  it('aynı düğüm tekrar seçildiğinde seçimi sıfırlar (tumu)', () => {
    component.seciliBolge = 'zon-1';
    spyOn(component.seciliBolgeDegisti, 'emit');
    component.dugumSec('zon-1');
    expect(component.seciliBolgeDegisti.emit).toHaveBeenCalledWith('tumu');
  });
});
