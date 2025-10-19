import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LLMValidationService } from './llm-validation.service';

describe('LLMValidationService', () => {
  let service: LLMValidationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LLMValidationService]
    });
    service = TestBed.inject(LLMValidationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return default validation when no API keys are configured', (done) => {
    const request = {
      title: 'Test Product',
      description: 'This is a test product description'
    };

    service.validateContent(request).subscribe(result => {
      expect(result.isAppropriate).toBe(true);
      expect(result.confidence).toBe(0.8);
      expect(result.reason).toContain('Validation automatique');
      done();
    });
  });

  it('should call Mistral API when Mistral key is available', (done) => {
    // Mock Mistral API key
    spyOn(service as any, 'getMistralApiKey').and.returnValue('test-mistral-key');

    const request = {
      title: 'Test Product',
      description: 'This is a test product description'
    };

    service.validateContent(request).subscribe(result => {
      // Should attempt to call Mistral API
      const req = httpMock.expectOne('https://api.mistral.ai/v1/moderations');
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-mistral-key');

      // Mock response
      req.flush({
        results: [{
          flagged: false,
          confidence: 0.9,
          categories: {}
        }]
      });

      done();
    });
  });

  it('should fallback to OpenAI when Mistral fails', (done) => {
    // Mock Mistral API key but simulate failure
    spyOn(service as any, 'getMistralApiKey').and.returnValue('test-mistral-key');
    spyOn(service as any, 'getOpenAIApiKey').and.returnValue('test-openai-key');

    const request = {
      title: 'Test Product',
      description: 'This is a test product description'
    };

    service.validateContent(request).subscribe(result => {
      // Should attempt Mistral first, then fallback to OpenAI
      const mistralReq = httpMock.expectOne('https://api.mistral.ai/v1/moderations');
      expect(mistralReq.request.method).toBe('POST');

      // Simulate Mistral failure
      mistralReq.error(new ErrorEvent('Network error'));

      // Should then call OpenAI
      const openaiReq = httpMock.expectOne('https://api.openai.com/v1/moderations');
      expect(openaiReq.request.method).toBe('POST');
      expect(openaiReq.request.headers.get('Authorization')).toBe('Bearer test-openai-key');

      done();
    });
  });
});