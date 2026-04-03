--
-- PostgreSQL database dump
--

\restrict ENRH8Nsed0l2KHQYiLkH9gLy8KJfjgsSgfFF575ptPZAdAxAJPX41PMill5ciYc

-- Dumped from database version 17.8 (a48d9ca)
-- Dumped by pg_dump version 17.9 (Ubuntu 17.9-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    name character varying(100) DEFAULT ''::character varying NOT NULL,
    account character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    avatar character varying(500) DEFAULT ''::character varying,
    role_name character varying(50) DEFAULT '管理员'::character varying,
    role_id integer DEFAULT 0,
    dept_name character varying(100) DEFAULT ''::character varying,
    dept_id integer DEFAULT 0,
    mobile character varying(20) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    status integer DEFAULT 1,
    remark text DEFAULT ''::text,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.admins OWNER TO neondb_owner;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO neondb_owner;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: bom_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.bom_items (
    id integer NOT NULL,
    bom_id integer NOT NULL,
    goods_id integer DEFAULT 0,
    goods_name character varying(200) DEFAULT ''::character varying,
    goods_sn character varying(100) DEFAULT ''::character varying,
    num numeric(10,4) DEFAULT 1,
    unit_name character varying(50) DEFAULT ''::character varying,
    price numeric(10,5) DEFAULT 0,
    remark text DEFAULT ''::text,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.bom_items OWNER TO neondb_owner;

--
-- Name: bom_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.bom_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bom_items_id_seq OWNER TO neondb_owner;

--
-- Name: bom_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.bom_items_id_seq OWNED BY public.bom_items.id;


--
-- Name: bom_order; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.bom_order (
    id integer NOT NULL,
    bom_code character varying(50) DEFAULT ''::character varying,
    goods_id integer DEFAULT 0,
    goods_name character varying(200) DEFAULT ''::character varying,
    goods_sn character varying(100) DEFAULT ''::character varying,
    spec character varying(200) DEFAULT ''::character varying,
    unit_name character varying(50) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.bom_order OWNER TO neondb_owner;

--
-- Name: bom_order_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.bom_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bom_order_id_seq OWNER TO neondb_owner;

--
-- Name: bom_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.bom_order_id_seq OWNED BY public.bom_order.id;


--
-- Name: collect_receipt; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.collect_receipt (
    id integer NOT NULL,
    receipt_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    contact_name character varying(100) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    receipt_date date,
    pay_type character varying(50) DEFAULT 'customer'::character varying,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone,
    category character varying(50) DEFAULT ''::character varying
);


ALTER TABLE public.collect_receipt OWNER TO neondb_owner;

--
-- Name: collect_receipt_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.collect_receipt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.collect_receipt_id_seq OWNER TO neondb_owner;

--
-- Name: collect_receipt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.collect_receipt_id_seq OWNED BY public.collect_receipt.id;


--
-- Name: company_info; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.company_info (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying,
    logo character varying(500) DEFAULT ''::character varying,
    address text DEFAULT ''::text,
    tel character varying(50) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text
);


ALTER TABLE public.company_info OWNER TO neondb_owner;

--
-- Name: company_info_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.company_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_info_id_seq OWNER TO neondb_owner;

--
-- Name: company_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.company_info_id_seq OWNED BY public.company_info.id;


--
-- Name: depts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.depts (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    parent_id integer DEFAULT 0,
    sort integer DEFAULT 0,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.depts OWNER TO neondb_owner;

--
-- Name: depts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.depts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.depts_id_seq OWNER TO neondb_owner;

--
-- Name: depts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.depts_id_seq OWNED BY public.depts.id;


--
-- Name: finance_costs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_costs (
    id integer NOT NULL,
    cost_no character varying(100) DEFAULT ''::character varying,
    name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    cost_date date,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_costs OWNER TO neondb_owner;

--
-- Name: finance_costs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_costs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_costs_id_seq OWNER TO neondb_owner;

--
-- Name: finance_costs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_costs_id_seq OWNED BY public.finance_costs.id;


--
-- Name: finance_expenses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_expenses (
    id integer NOT NULL,
    expense_no character varying(100) DEFAULT ''::character varying,
    name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    expense_date date,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_expenses OWNER TO neondb_owner;

--
-- Name: finance_expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_expenses_id_seq OWNER TO neondb_owner;

--
-- Name: finance_expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_expenses_id_seq OWNED BY public.finance_expenses.id;


--
-- Name: finance_funds; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_funds (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    fund_type integer DEFAULT 1,
    balance numeric(10,2) DEFAULT 0,
    bank_name character varying(100) DEFAULT ''::character varying,
    bank_account character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_funds OWNER TO neondb_owner;

--
-- Name: finance_funds_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_funds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_funds_id_seq OWNER TO neondb_owner;

--
-- Name: finance_funds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_funds_id_seq OWNED BY public.finance_funds.id;


--
-- Name: finance_invoices; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_invoices (
    id integer NOT NULL,
    invoice_no character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    invoice_date date,
    type integer DEFAULT 1,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_invoices OWNER TO neondb_owner;

--
-- Name: finance_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_invoices_id_seq OWNER TO neondb_owner;

--
-- Name: finance_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_invoices_id_seq OWNED BY public.finance_invoices.id;


--
-- Name: finance_payable; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_payable (
    id integer NOT NULL,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    order_amount numeric(10,2) DEFAULT 0,
    paid_amount numeric(10,2) DEFAULT 0,
    un_pay_amount numeric(10,2) DEFAULT 0,
    due_date date,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.finance_payable OWNER TO neondb_owner;

--
-- Name: finance_payable_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_payable_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_payable_id_seq OWNER TO neondb_owner;

--
-- Name: finance_payable_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_payable_id_seq OWNED BY public.finance_payable.id;


--
-- Name: finance_receivable; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_receivable (
    id integer NOT NULL,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    total_amount numeric(10,2) DEFAULT 0,
    paid_amount numeric(10,2) DEFAULT 0,
    un_pay_amount numeric(10,2) DEFAULT 0,
    due_date date,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.finance_receivable OWNER TO neondb_owner;

--
-- Name: finance_receivable_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_receivable_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_receivable_id_seq OWNER TO neondb_owner;

--
-- Name: finance_receivable_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_receivable_id_seq OWNED BY public.finance_receivable.id;


--
-- Name: finance_statements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_statements (
    id integer NOT NULL,
    statement_no character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    start_date date,
    end_date date,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_statements OWNER TO neondb_owner;

--
-- Name: finance_statements_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_statements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_statements_id_seq OWNER TO neondb_owner;

--
-- Name: finance_statements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_statements_id_seq OWNED BY public.finance_statements.id;


--
-- Name: goods; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying,
    code character varying(100) DEFAULT ''::character varying,
    cate_id integer DEFAULT 0,
    cate_name character varying(100) DEFAULT ''::character varying,
    unit_id integer DEFAULT 0,
    unit_name character varying(50) DEFAULT ''::character varying,
    brand_id integer DEFAULT 0,
    brand_name character varying(100) DEFAULT ''::character varying,
    spec text DEFAULT ''::text,
    price numeric(10,2) DEFAULT 0,
    cost numeric(10,2) DEFAULT 0,
    stock integer DEFAULT 0,
    min_stock integer DEFAULT 0,
    max_stock integer DEFAULT 0,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    images text DEFAULT ''::text,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone,
    goods_name character varying(200) DEFAULT ''::character varying NOT NULL,
    goods_sn character varying(100) DEFAULT ''::character varying,
    en_name character varying(200) DEFAULT ''::character varying,
    goods_memo character varying(200) DEFAULT ''::character varying,
    goods_type integer DEFAULT 1,
    sell_price numeric(10,2) DEFAULT 0,
    cost_price numeric(10,2) DEFAULT 0,
    barcode character varying(100) DEFAULT ''::character varying,
    safe_min integer DEFAULT 0,
    safe_max integer DEFAULT 0,
    sort integer DEFAULT 0,
    make_time integer DEFAULT 0,
    can_sale integer DEFAULT 1,
    can_buy integer DEFAULT 1,
    can_make integer DEFAULT 1,
    can_outsource integer DEFAULT 1,
    multi_unit boolean DEFAULT false,
    multi_spec boolean DEFAULT false
);


ALTER TABLE public.goods OWNER TO neondb_owner;

--
-- Name: goods_brand; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods_brand (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.goods_brand OWNER TO neondb_owner;

--
-- Name: goods_brand_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_brand_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_brand_id_seq OWNER TO neondb_owner;

--
-- Name: goods_brand_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_brand_id_seq OWNED BY public.goods_brand.id;


--
-- Name: goods_cate; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods_cate (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    parent_id integer DEFAULT 0,
    sort integer DEFAULT 0,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.goods_cate OWNER TO neondb_owner;

--
-- Name: goods_cate_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_cate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_cate_id_seq OWNER TO neondb_owner;

--
-- Name: goods_cate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_cate_id_seq OWNED BY public.goods_cate.id;


--
-- Name: goods_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_id_seq OWNER TO neondb_owner;

--
-- Name: goods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_id_seq OWNED BY public.goods.id;


--
-- Name: goods_spec; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods_spec (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    "values" text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.goods_spec OWNER TO neondb_owner;

--
-- Name: goods_spec_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_spec_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_spec_id_seq OWNER TO neondb_owner;

--
-- Name: goods_spec_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_spec_id_seq OWNED BY public.goods_spec.id;


--
-- Name: goods_unit; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods_unit (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.goods_unit OWNER TO neondb_owner;

--
-- Name: goods_unit_convert; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods_unit_convert (
    id integer NOT NULL,
    goods_id integer NOT NULL,
    unit_name character varying(50) NOT NULL,
    ratio numeric(10,4) DEFAULT 1 NOT NULL,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.goods_unit_convert OWNER TO neondb_owner;

--
-- Name: goods_unit_convert_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_unit_convert_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_unit_convert_id_seq OWNER TO neondb_owner;

--
-- Name: goods_unit_convert_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_unit_convert_id_seq OWNED BY public.goods_unit_convert.id;


--
-- Name: goods_unit_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_unit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_unit_id_seq OWNER TO neondb_owner;

--
-- Name: goods_unit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_unit_id_seq OWNED BY public.goods_unit.id;


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.jobs (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    dept_id integer DEFAULT 0,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.jobs OWNER TO neondb_owner;

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_id_seq OWNER TO neondb_owner;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: operation_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.operation_logs (
    id integer NOT NULL,
    admin_id integer DEFAULT 0,
    admin_name character varying(100) DEFAULT ''::character varying,
    action character varying(200) DEFAULT ''::character varying,
    ip character varying(50) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.operation_logs OWNER TO neondb_owner;

--
-- Name: operation_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.operation_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.operation_logs_id_seq OWNER TO neondb_owner;

--
-- Name: operation_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.operation_logs_id_seq OWNED BY public.operation_logs.id;


--
-- Name: pay_receipt; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pay_receipt (
    id integer NOT NULL,
    receipt_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    contact_type character varying(50) DEFAULT 'supplier'::character varying,
    contact_name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    pay_date date,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone,
    category character varying(50) DEFAULT ''::character varying
);


ALTER TABLE public.pay_receipt OWNER TO neondb_owner;

--
-- Name: pay_receipt_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pay_receipt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pay_receipt_id_seq OWNER TO neondb_owner;

--
-- Name: pay_receipt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pay_receipt_id_seq OWNED BY public.pay_receipt.id;


--
-- Name: prepay_record; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.prepay_record (
    id integer NOT NULL,
    order_sn character varying(100) DEFAULT ''::character varying,
    pay_type character varying(50) DEFAULT 'customer'::character varying,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    pay_date date,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.prepay_record OWNER TO neondb_owner;

--
-- Name: prepay_record_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.prepay_record_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prepay_record_id_seq OWNER TO neondb_owner;

--
-- Name: prepay_record_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.prepay_record_id_seq OWNED BY public.prepay_record.id;


--
-- Name: procure_inhouse; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.procure_inhouse (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    purchase_order_id integer DEFAULT 0,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    in_date date,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.procure_inhouse OWNER TO neondb_owner;

--
-- Name: procure_inhouse_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.procure_inhouse_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.procure_inhouse_id_seq OWNER TO neondb_owner;

--
-- Name: procure_inhouse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.procure_inhouse_id_seq OWNED BY public.procure_inhouse.id;


--
-- Name: procure_plan; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.procure_plan (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    plan_date date,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    admin_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.procure_plan OWNER TO neondb_owner;

--
-- Name: procure_plan_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.procure_plan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.procure_plan_id_seq OWNER TO neondb_owner;

--
-- Name: procure_plan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.procure_plan_id_seq OWNED BY public.procure_plan.id;


--
-- Name: procure_return; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.procure_return (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    order_id integer DEFAULT 0,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    return_date date,
    total_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    fund_id integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.procure_return OWNER TO neondb_owner;

--
-- Name: procure_return_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.procure_return_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.procure_return_id_seq OWNER TO neondb_owner;

--
-- Name: procure_return_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.procure_return_id_seq OWNED BY public.procure_return.id;


--
-- Name: purchase_order; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.purchase_order (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    order_date date,
    total_amount numeric(10,2) DEFAULT 0,
    pay_amount numeric(10,2) DEFAULT 0,
    freight_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.purchase_order OWNER TO neondb_owner;

--
-- Name: purchase_order_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.purchase_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_order_id_seq OWNER TO neondb_owner;

--
-- Name: purchase_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.purchase_order_id_seq OWNED BY public.purchase_order.id;


--
-- Name: retail_members; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.retail_members (
    id integer NOT NULL,
    name character varying(100) DEFAULT ''::character varying,
    mobile character varying(20) DEFAULT ''::character varying,
    gender integer DEFAULT 0,
    birthday date,
    balance numeric(10,2) DEFAULT 0,
    points integer DEFAULT 0,
    level character varying(50) DEFAULT '普通会员'::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.retail_members OWNER TO neondb_owner;

--
-- Name: retail_members_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.retail_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.retail_members_id_seq OWNER TO neondb_owner;

--
-- Name: retail_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.retail_members_id_seq OWNED BY public.retail_members.id;


--
-- Name: retail_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.retail_orders (
    id integer NOT NULL,
    order_sn character varying(100) DEFAULT ''::character varying,
    member_id integer DEFAULT 0,
    member_name character varying(100) DEFAULT ''::character varying,
    goods_info jsonb DEFAULT '[]'::jsonb,
    total_amount numeric(10,2) DEFAULT 0,
    pay_amount numeric(10,2) DEFAULT 0,
    pay_type character varying(50) DEFAULT ''::character varying,
    order_date date,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.retail_orders OWNER TO neondb_owner;

--
-- Name: retail_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.retail_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.retail_orders_id_seq OWNER TO neondb_owner;

--
-- Name: retail_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.retail_orders_id_seq OWNED BY public.retail_orders.id;


--
-- Name: retail_recharge; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.retail_recharge (
    id integer NOT NULL,
    recharge_no character varying(100) DEFAULT ''::character varying,
    member_id integer DEFAULT 0,
    member_name character varying(100) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.retail_recharge OWNER TO neondb_owner;

--
-- Name: retail_recharge_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.retail_recharge_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.retail_recharge_id_seq OWNER TO neondb_owner;

--
-- Name: retail_recharge_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.retail_recharge_id_seq OWNED BY public.retail_recharge.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    permissions text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO neondb_owner;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO neondb_owner;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: sale_contracts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_contracts (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    order_date date,
    total_amount numeric(10,2) DEFAULT 0,
    pay_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_contracts OWNER TO neondb_owner;

--
-- Name: sale_contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_contracts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_contracts_id_seq OWNER TO neondb_owner;

--
-- Name: sale_contracts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_contracts_id_seq OWNED BY public.sale_contracts.id;


--
-- Name: sale_customers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_customers (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying NOT NULL,
    nickname character varying(100) DEFAULT ''::character varying,
    code character varying(100) DEFAULT ''::character varying,
    mobile character varying(20) DEFAULT ''::character varying,
    tel character varying(20) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    address text DEFAULT ''::text,
    contact character varying(100) DEFAULT ''::character varying,
    level_name character varying(50) DEFAULT '普通客户'::character varying,
    source_name character varying(50) DEFAULT ''::character varying,
    level_id integer DEFAULT 0,
    source_id integer DEFAULT 0,
    follow_admin_id integer DEFAULT 0,
    follow_admin character varying(50) DEFAULT ''::character varying,
    balance numeric(10,2) DEFAULT 0,
    is_sea integer DEFAULT 0,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_customers OWNER TO neondb_owner;

--
-- Name: sale_customers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_customers_id_seq OWNER TO neondb_owner;

--
-- Name: sale_customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_customers_id_seq OWNED BY public.sale_customers.id;


--
-- Name: sale_offers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_offers (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    offer_date date,
    total_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_offers OWNER TO neondb_owner;

--
-- Name: sale_offers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_offers_id_seq OWNER TO neondb_owner;

--
-- Name: sale_offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_offers_id_seq OWNED BY public.sale_offers.id;


--
-- Name: sale_out_order; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_out_order (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    out_date date,
    total_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_out_order OWNER TO neondb_owner;

--
-- Name: sale_out_order_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_out_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_out_order_id_seq OWNER TO neondb_owner;

--
-- Name: sale_out_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_out_order_id_seq OWNED BY public.sale_out_order.id;


--
-- Name: sale_return_order; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_return_order (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    return_date date,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_return_order OWNER TO neondb_owner;

--
-- Name: sale_return_order_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_return_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_return_order_id_seq OWNER TO neondb_owner;

--
-- Name: sale_return_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_return_order_id_seq OWNED BY public.sale_return_order.id;


--
-- Name: staff; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.staff (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50) DEFAULT ''::character varying,
    mobile character varying(20) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    dept_id integer DEFAULT 0,
    dept_name character varying(100) DEFAULT ''::character varying,
    job_id integer DEFAULT 0,
    job_name character varying(100) DEFAULT ''::character varying,
    entry_date date,
    gender integer DEFAULT 1,
    status integer DEFAULT 1,
    remark text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.staff OWNER TO neondb_owner;

--
-- Name: staff_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.staff_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_id_seq OWNER TO neondb_owner;

--
-- Name: staff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.staff_id_seq OWNED BY public.staff.id;


--
-- Name: stock_checks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_checks (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    admin_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_checks OWNER TO neondb_owner;

--
-- Name: stock_checks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_checks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_checks_id_seq OWNER TO neondb_owner;

--
-- Name: stock_checks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_checks_id_seq OWNED BY public.stock_checks.id;


--
-- Name: stock_flow; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_flow (
    id integer NOT NULL,
    goods_id integer DEFAULT 0,
    goods_name character varying(200) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    type character varying(50) DEFAULT ''::character varying,
    qty integer DEFAULT 0,
    before_qty integer DEFAULT 0,
    after_qty integer DEFAULT 0,
    order_no character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_flow OWNER TO neondb_owner;

--
-- Name: stock_flow_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_flow_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_flow_id_seq OWNER TO neondb_owner;

--
-- Name: stock_flow_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_flow_id_seq OWNED BY public.stock_flow.id;


--
-- Name: stock_inventory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_inventory (
    id integer NOT NULL,
    goods_id integer DEFAULT 0,
    goods_name character varying(200) DEFAULT ''::character varying,
    goods_code character varying(100) DEFAULT ''::character varying,
    unit_name character varying(50) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    qty integer DEFAULT 0,
    cost numeric(10,2) DEFAULT 0,
    update_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_inventory OWNER TO neondb_owner;

--
-- Name: stock_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_inventory_id_seq OWNER TO neondb_owner;

--
-- Name: stock_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_inventory_id_seq OWNED BY public.stock_inventory.id;


--
-- Name: stock_other_in; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_other_in (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_other_in OWNER TO neondb_owner;

--
-- Name: stock_other_in_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_other_in_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_other_in_id_seq OWNER TO neondb_owner;

--
-- Name: stock_other_in_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_other_in_id_seq OWNED BY public.stock_other_in.id;


--
-- Name: stock_other_out; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_other_out (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_other_out OWNER TO neondb_owner;

--
-- Name: stock_other_out_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_other_out_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_other_out_id_seq OWNER TO neondb_owner;

--
-- Name: stock_other_out_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_other_out_id_seq OWNED BY public.stock_other_out.id;


--
-- Name: supplier; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.supplier (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    contact character varying(100) DEFAULT ''::character varying,
    mobile character varying(20) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    address text DEFAULT ''::text,
    bank character varying(100) DEFAULT ''::character varying,
    bank_account character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.supplier OWNER TO neondb_owner;

--
-- Name: supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.supplier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supplier_id_seq OWNER TO neondb_owner;

--
-- Name: supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.supplier_id_seq OWNED BY public.supplier.id;


--
-- Name: sys_params; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sys_params (
    id integer NOT NULL,
    key character varying(100),
    value text DEFAULT ''::text,
    remark text DEFAULT ''::text
);


ALTER TABLE public.sys_params OWNER TO neondb_owner;

--
-- Name: sys_params_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sys_params_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sys_params_id_seq OWNER TO neondb_owner;

--
-- Name: sys_params_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sys_params_id_seq OWNED BY public.sys_params.id;


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.warehouses (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    address text DEFAULT ''::text,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.warehouses OWNER TO neondb_owner;

--
-- Name: warehouses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.warehouses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warehouses_id_seq OWNER TO neondb_owner;

--
-- Name: warehouses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.warehouses_id_seq OWNED BY public.warehouses.id;


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: bom_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bom_items ALTER COLUMN id SET DEFAULT nextval('public.bom_items_id_seq'::regclass);


--
-- Name: bom_order id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bom_order ALTER COLUMN id SET DEFAULT nextval('public.bom_order_id_seq'::regclass);


--
-- Name: collect_receipt id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.collect_receipt ALTER COLUMN id SET DEFAULT nextval('public.collect_receipt_id_seq'::regclass);


--
-- Name: company_info id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_info ALTER COLUMN id SET DEFAULT nextval('public.company_info_id_seq'::regclass);


--
-- Name: depts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.depts ALTER COLUMN id SET DEFAULT nextval('public.depts_id_seq'::regclass);


--
-- Name: finance_costs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_costs ALTER COLUMN id SET DEFAULT nextval('public.finance_costs_id_seq'::regclass);


--
-- Name: finance_expenses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_expenses ALTER COLUMN id SET DEFAULT nextval('public.finance_expenses_id_seq'::regclass);


--
-- Name: finance_funds id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_funds ALTER COLUMN id SET DEFAULT nextval('public.finance_funds_id_seq'::regclass);


--
-- Name: finance_invoices id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_invoices ALTER COLUMN id SET DEFAULT nextval('public.finance_invoices_id_seq'::regclass);


--
-- Name: finance_payable id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_payable ALTER COLUMN id SET DEFAULT nextval('public.finance_payable_id_seq'::regclass);


--
-- Name: finance_receivable id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_receivable ALTER COLUMN id SET DEFAULT nextval('public.finance_receivable_id_seq'::regclass);


--
-- Name: finance_statements id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_statements ALTER COLUMN id SET DEFAULT nextval('public.finance_statements_id_seq'::regclass);


--
-- Name: goods id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods ALTER COLUMN id SET DEFAULT nextval('public.goods_id_seq'::regclass);


--
-- Name: goods_brand id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_brand ALTER COLUMN id SET DEFAULT nextval('public.goods_brand_id_seq'::regclass);


--
-- Name: goods_cate id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_cate ALTER COLUMN id SET DEFAULT nextval('public.goods_cate_id_seq'::regclass);


--
-- Name: goods_spec id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_spec ALTER COLUMN id SET DEFAULT nextval('public.goods_spec_id_seq'::regclass);


--
-- Name: goods_unit id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_unit ALTER COLUMN id SET DEFAULT nextval('public.goods_unit_id_seq'::regclass);


--
-- Name: goods_unit_convert id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_unit_convert ALTER COLUMN id SET DEFAULT nextval('public.goods_unit_convert_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: operation_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.operation_logs ALTER COLUMN id SET DEFAULT nextval('public.operation_logs_id_seq'::regclass);


--
-- Name: pay_receipt id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pay_receipt ALTER COLUMN id SET DEFAULT nextval('public.pay_receipt_id_seq'::regclass);


--
-- Name: prepay_record id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.prepay_record ALTER COLUMN id SET DEFAULT nextval('public.prepay_record_id_seq'::regclass);


--
-- Name: procure_inhouse id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_inhouse ALTER COLUMN id SET DEFAULT nextval('public.procure_inhouse_id_seq'::regclass);


--
-- Name: procure_plan id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_plan ALTER COLUMN id SET DEFAULT nextval('public.procure_plan_id_seq'::regclass);


--
-- Name: procure_return id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_return ALTER COLUMN id SET DEFAULT nextval('public.procure_return_id_seq'::regclass);


--
-- Name: purchase_order id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_order ALTER COLUMN id SET DEFAULT nextval('public.purchase_order_id_seq'::regclass);


--
-- Name: retail_members id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_members ALTER COLUMN id SET DEFAULT nextval('public.retail_members_id_seq'::regclass);


--
-- Name: retail_orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_orders ALTER COLUMN id SET DEFAULT nextval('public.retail_orders_id_seq'::regclass);


--
-- Name: retail_recharge id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_recharge ALTER COLUMN id SET DEFAULT nextval('public.retail_recharge_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: sale_contracts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_contracts ALTER COLUMN id SET DEFAULT nextval('public.sale_contracts_id_seq'::regclass);


--
-- Name: sale_customers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_customers ALTER COLUMN id SET DEFAULT nextval('public.sale_customers_id_seq'::regclass);


--
-- Name: sale_offers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_offers ALTER COLUMN id SET DEFAULT nextval('public.sale_offers_id_seq'::regclass);


--
-- Name: sale_out_order id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_out_order ALTER COLUMN id SET DEFAULT nextval('public.sale_out_order_id_seq'::regclass);


--
-- Name: sale_return_order id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_return_order ALTER COLUMN id SET DEFAULT nextval('public.sale_return_order_id_seq'::regclass);


--
-- Name: staff id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff ALTER COLUMN id SET DEFAULT nextval('public.staff_id_seq'::regclass);


--
-- Name: stock_checks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_checks ALTER COLUMN id SET DEFAULT nextval('public.stock_checks_id_seq'::regclass);


--
-- Name: stock_flow id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_flow ALTER COLUMN id SET DEFAULT nextval('public.stock_flow_id_seq'::regclass);


--
-- Name: stock_inventory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_inventory ALTER COLUMN id SET DEFAULT nextval('public.stock_inventory_id_seq'::regclass);


--
-- Name: stock_other_in id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_other_in ALTER COLUMN id SET DEFAULT nextval('public.stock_other_in_id_seq'::regclass);


--
-- Name: stock_other_out id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_other_out ALTER COLUMN id SET DEFAULT nextval('public.stock_other_out_id_seq'::regclass);


--
-- Name: supplier id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.supplier ALTER COLUMN id SET DEFAULT nextval('public.supplier_id_seq'::regclass);


--
-- Name: sys_params id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sys_params ALTER COLUMN id SET DEFAULT nextval('public.sys_params_id_seq'::regclass);


--
-- Name: warehouses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.warehouses ALTER COLUMN id SET DEFAULT nextval('public.warehouses_id_seq'::regclass);


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.admins (id, name, account, password, avatar, role_name, role_id, dept_name, dept_id, mobile, email, status, remark, create_time, update_time, deleted_at) FROM stdin;
1	管理员	17747344571	Oral6421		超级管理员	0		0			1		2026-03-28 12:40:01.408684	2026-03-28 12:40:01.408684	\N
2	管理员	admin	123456		超级管理员	0		0			1		2026-03-28 13:04:00.311975	2026-03-28 13:04:00.311975	\N
29	测试员工	test_staff_001	$2a$10$bKTSe5RPacbm3Q1RGHX2k.bY7C0a4sA4cdY9qFLJE4e5MHAvaI.Qu		管理员	0		0	13800000001		1		2026-03-29 16:04:41.972514	2026-03-29 16:04:41.972514	2026-03-29 16:05:10.104557
30	测试员工2	staff_1774800364	$2a$10$RoFdTN.1y5FSf9ahaoK5ve1F7LRJIeUhcT4UEyEM5lFXr9mM74qGK		管理员	0		0	13800000002		1		2026-03-29 16:06:06.366732	2026-03-29 16:06:06.366732	\N
\.


--
-- Data for Name: bom_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.bom_items (id, bom_id, goods_id, goods_name, goods_sn, num, unit_name, price, remark, create_time) FROM stdin;
1	1	0	奶果子/散装	SP0000043	1.0000	斤	0.80000		2026-04-01 15:06:22.275314
2	1	0	专内袋/奶果子	SP0000008	1.0000	张	0.07879		2026-04-01 15:06:22.281244
3	2	0	新年福字袋/小	SP0000202	1.0000	袋	0.22000		2026-04-01 15:06:25.561869
4	2	0	脆奶条/散装/科尔沁	SP0000119	0.3600	斤	7.00000		2026-04-01 15:06:25.56507
5	3	0	红糖袋/delicious	SP0000185	1.0000	张	0.00000		2026-04-01 15:06:27.473767
6	3	0	糖/阿润	SP0000176	1.0000	散	25.00000		2026-04-01 15:06:27.476734
7	4	0	半成品/黄金纬度牛肉干/那牧尔	SP0000163	1.0000	袋	41.44000		2026-04-01 15:06:28.945438
8	4	0	专袋/牛肉干包装	SP0000162	1.0000	袋	1.46700		2026-04-01 15:06:28.9482
9	5	0	半成品/透明/奶皮千层	SP0000091	1.0000	盒	12.00000		2026-04-01 15:06:30.31831
10	5	0	三角/奶皮千层盒	SP0000075	1.0000	盒	0.85000		2026-04-01 15:06:30.321133
11	5	0	透专标签/奶皮千层	SP0000137	1.0000	张	0.06700		2026-04-01 15:06:30.324031
12	6	0	扁盒/亚克力/带内托	SP0000074	1.0000	盒	1.75000		2026-04-01 15:06:52.227215
13	6	0	半成品/透明/奶皮卷	SP0000090	1.0000	盒	13.00000		2026-04-01 15:06:52.275816
14	6	0	透专标签/奶皮卷	SP0000085	1.0000	张	0.37237		2026-04-01 15:06:52.278913
15	7	0	小/长方/亚克力/乳清奶条盒	SP0000077	1.0000	盒	1.20000		2026-04-01 15:06:58.759069
16	7	0	透专标签/乳清奶条/原味	SP0000080	1.0000	张	0.05137		2026-04-01 15:06:58.761899
17	7	0	原味传统奶豆腐/成品袋装	SP0000046	1.0000	袋	12.78000		2026-04-01 15:06:58.764853
18	8	0	小/长方/亚克力/乳清奶条盒	SP0000077	1.0000	盒	1.20000		2026-04-01 15:07:01.194345
19	8	0	透专标签/乳清奶条/甜味	SP0000081	1.0000	张	0.05137		2026-04-01 15:07:01.197552
20	8	0	半成品/透明/甜味奶条	SP0000093	1.0000	盒	6.80000		2026-04-01 15:07:01.200582
21	8	0	散装/甜味奶条	SP0000020	1.0000	盒	8.50000		2026-04-01 15:07:01.203298
22	9	0	半成品/透明/鲜奶皮	SP0000089	1.0000	盒	14.00000		2026-04-01 15:07:03.542003
23	9	0	中/方形/亚克力盒/	SP0000072	1.0000	盒	0.85000		2026-04-01 15:07:03.545902
24	9	0	透专标签/鲜奶皮	SP0000079	1.0000	张	0.37237		2026-04-01 15:07:03.54874
25	10	0	半成品/透明/甜味/鲜奶酪	SP0000095	1.0000	盒	13.00000		2026-04-01 15:07:06.054957
26	10	0	透专标签/奶酪/甜味	SP0000082	1.0000	张	0.37237		2026-04-01 15:07:06.057811
27	10	0	小/方形/亚克力盒/	SP0000071	1.0000	盒	0.80000		2026-04-01 15:07:06.060607
28	11	0	半成品/透明/原味/鲜奶酪	SP0000096	1.0000	盒	13.00000		2026-04-01 15:07:10.133902
29	11	0	小/方形/亚克力盒/	SP0000071	1.0000	盒	0.80000		2026-04-01 15:07:10.137293
30	11	0	透专标签/奶酪/原味	SP0000083	1.0000	张	0.37237		2026-04-01 15:07:10.140347
31	12	0	甜味/标签/不干胶/传统奶豆腐	SP0000051	1.0000	张	0.06000		2026-04-01 15:07:13.99701
32	12	0	专袋/传统奶豆腐	SP0000012	1.0000	张	0.55000		2026-04-01 15:07:14.000115
33	12	0	精品/奶豆腐块儿/甜味/	SP0000061	1.0000	袋	14.50000		2026-04-01 15:07:14.002931
34	12	0	真空袋	SP0000007	1.0000	张	0.17000		2026-04-01 15:07:14.005699
35	13	0	小/方形/亚克力盒/	SP0000071	1.0000	盒	0.80000		2026-04-01 15:07:18.520665
36	13	0	透专标签/冻炒米	SP0000084	1.0000	张	0.37237		2026-04-01 15:07:18.523358
37	13	0	半成品/透明/冻炒米	SP0000069	1.0000	盒	4.20000		2026-04-01 15:07:18.526405
38	14	0	真空袋	SP0000007	1.0000	张	0.17000		2026-04-01 15:07:20.27421
39	14	0	专袋/传统奶豆腐	SP0000012	1.0000	张	0.55000		2026-04-01 15:07:20.2771
40	14	0	原味/标签/不干胶/传统奶豆腐	SP0000013	1.0000	张	0.06000		2026-04-01 15:07:20.279959
41	14	0	精品/奶豆腐块儿/原味	SP0000048	1.0000	袋	14.50000		2026-04-01 15:07:20.282869
42	15	0	黄油脖签	SP0000059	1.0000	张	0.08160		2026-04-01 15:07:23.000925
43	15	0	真空袋	SP0000007	1.0000	张	0.17000		2026-04-01 15:07:23.003699
44	15	0	纯净黄油/瓶装好的	SP0000060	1.0000	瓶	6.00000		2026-04-01 15:07:23.006431
45	15	0	专瓶/黄油	SP0000018	1.0000	瓶	1.80000		2026-04-01 15:07:23.00906
46	15	0	专标签/黄油	SP0000006	1.0000	张	0.06000		2026-04-01 15:07:23.011952
47	16	0	新茶专用标签纸	SP0000056	1.0000	张	0.05433		2026-04-01 15:07:25.25387
48	16	0	新茶包/纸	SP0000055	16.0000	张	0.26500		2026-04-01 15:07:25.256699
49	16	0	茶专用/热缩膜	SP0000039	1.0000	袋	0.10000		2026-04-01 15:07:25.259361
50	16	0	茶专用/硫酸纸	SP0000036	1.0000	张	0.32000		2026-04-01 15:07:25.262187
51	16	0	木勺	SP0000034	1.0000	个	0.15990		2026-04-01 15:07:25.267852
52	16	0	专盒/青砖奶茶外盒	SP0000025	1.0000	张	2.50000		2026-04-01 15:07:25.270708
53	16	0	奶油球	SP0000024	16.0000	个	0.45400		2026-04-01 15:07:25.273539
54	16	0	茶包	SP0000023	16.0000	小包	0.17656		2026-04-01 15:07:25.276301
55	17	0	茶专用/热缩膜	SP0000039	1.0000	袋	0.10000		2026-04-01 15:07:27.639188
56	17	0	茶专用/硫酸纸	SP0000036	1.0000	张	0.32000		2026-04-01 15:07:27.642573
57	17	0	茶专用/不干胶/标签	SP0000035	1.0000	张	0.04000		2026-04-01 15:07:27.645667
58	17	0	木勺	SP0000034	1.0000	个	0.15990		2026-04-01 15:07:27.648422
59	17	0	专盒/青砖奶茶外盒	SP0000025	1.0000	张	2.50000		2026-04-01 15:07:27.655386
60	17	0	新茶包人工费	SP0000057	1.0000	盒	1.00000		2026-04-01 15:07:27.65845
61	17	0	奶油球	SP0000024	16.0000	个	0.45400		2026-04-01 15:07:27.661248
62	17	0	茶包	SP0000023	16.0000	小包	0.17656		2026-04-01 15:07:27.6642
63	18	0	标签/不干胶/奶条/甜味	SP0000010	1.0000	张	0.05000		2026-04-01 15:07:30.465694
64	18	0	专底盒/奶条	SP0000003	1.0000	张	0.37000		2026-04-01 15:07:30.46853
65	18	0	专袋/奶条	SP0000001	1.0000	张	0.71000		2026-04-01 15:07:30.471342
66	18	0	散装/甜味奶条	SP0000020	1.0000	袋	8.50000		2026-04-01 15:07:30.474091
67	19	0	标签/不干胶/奶条/原味	SP0000011	1.0000	张	0.05000		2026-04-01 15:07:34.923163
68	19	0	专底盒/奶条	SP0000003	1.0000	张	0.37000		2026-04-01 15:07:34.92614
69	19	0	专袋/奶条	SP0000001	1.0000	张	0.71000		2026-04-01 15:07:34.929052
70	19	0	散装/原味奶条	SP0000019	1.0000	袋	9.00000		2026-04-01 15:07:34.932076
71	20	0	冻炒米专用/塑膜袋	SP0000041	1.0000	张	0.10000		2026-04-01 15:07:36.141672
72	20	0	标签/不干胶/冻炒米	SP0000015	1.0000	张	0.06700		2026-04-01 15:07:36.144614
73	20	0	专盒/冻炒米	SP0000002	1.0000	张	0.87000		2026-04-01 15:07:36.147587
74	20	0	冻炒米/给组装半成品/那牧尔	SP0000021	1.0000	盒	5.50000		2026-04-01 15:07:36.150286
75	21	0	茶专用/硫酸纸	SP0000036	1.0000	张	0.32000		2026-04-01 15:07:40.795899
76	21	0	茶专用/不干胶/标签	SP0000035	1.0000	张	0.04000		2026-04-01 15:07:40.798896
77	21	0	木勺	SP0000034	1.0000	个	0.15990		2026-04-01 15:07:40.801714
78	21	0	专盒/青砖奶茶外盒	SP0000025	1.0000	张	2.50000		2026-04-01 15:07:40.804683
79	21	0	奶油球	SP0000024	16.0000	个	0.45400		2026-04-01 15:07:40.807759
80	21	0	茶包	SP0000023	16.0000	小包	0.17656		2026-04-01 15:07:40.810632
81	21	0	茶专用/盐包	SP0000037	16.0000	小包	0.06800		2026-04-01 15:07:40.813217
82	21	0	茶专用/热缩膜	SP0000039	1.0000	袋	0.10000		2026-04-01 15:07:40.815943
83	22	0	奶果子/散装	SP0000043	15.0000	块儿	0.80000		2026-04-01 15:07:45.115117
84	22	0	专外盒/奶果子	SP0000004	1.0000	张	0.65000		2026-04-01 15:07:45.11822
85	22	0	专内盒/奶果子	SP0000005	1.0000	张	0.65000		2026-04-01 15:07:45.12129
86	22	0	专内袋/奶果子	SP0000008	15.0000	张	0.07879		2026-04-01 15:07:45.124219
87	22	0	奶果子/专用塑膜袋	SP0000044	1.0000	袋	0.10000		2026-04-01 15:07:45.126948
88	22	0	标签/不干胶/奶果子	SP0000014	1.0000	张	0.03000		2026-04-01 15:07:45.129707
\.


--
-- Data for Name: bom_order; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.bom_order (id, bom_code, goods_id, goods_name, goods_sn, spec, unit_name, remark, status, create_time, update_time, deleted_at) FROM stdin;
1	BOM000001	0	奶果子/小包装/成品	SP0000200	散装	散		1	2026-04-01 15:06:22.217308	2026-04-01 15:06:22.217308	\N
2	BOM000002	0	10元/脆香奶条	SP0000203	180	袋		1	2026-04-01 15:06:25.558218	2026-04-01 15:06:25.558218	\N
3	BOM000003	0	15元组合糖	SP0000186	净含量172	袋		1	2026-04-01 15:06:27.470073	2026-04-01 15:06:27.470073	\N
4	BOM000004	0	黄金纬度/牛肉干/成品袋	SP0000161	140克	袋		1	2026-04-01 15:06:28.942477	2026-04-01 15:06:28.942477	\N
5	BOM000005	0	透明成品/奶皮千层/线下	SP0000101	180克	盒		1	2026-04-01 15:06:30.31523	2026-04-01 15:06:30.31523	\N
6	BOM000006	0	透明成品/奶皮卷/线下	SP0000100	180克	盒		1	2026-04-01 15:06:52.219708	2026-04-01 15:06:52.219708	\N
7	BOM000007	0	透明成品/奶条/原味/线下	SP0000102	180克	盒		1	2026-04-01 15:06:58.755812	2026-04-01 15:06:58.755812	\N
8	BOM000008	0	透明成品/奶条/甜味/线下	SP0000099	180克	盒		1	2026-04-01 15:07:01.190973	2026-04-01 15:07:01.190973	\N
9	BOM000009	0	透明成品/鲜奶皮/线下	SP0000098	180克	盒		1	2026-04-01 15:07:03.538903	2026-04-01 15:07:03.538903	\N
10	BOM000010	0	透明成品/鲜奶酪/甜味/线下	SP0000097	140克	盒		1	2026-04-01 15:07:06.051777	2026-04-01 15:07:06.051777	\N
11	BOM000011	0	透明成品/鲜奶酪/原味/线下	SP0000094	140克	盒		1	2026-04-01 15:07:10.13018	2026-04-01 15:07:10.13018	\N
12	BOM000012	0	甜味传统奶豆腐/袋装成品	SP0000049	150克	袋		1	2026-04-01 15:07:13.99372	2026-04-01 15:07:13.99372	\N
13	BOM000013	0	透明成品/冻炒米/线下	SP0000070	140克	盒		1	2026-04-01 15:07:18.517584	2026-04-01 15:07:18.517584	\N
14	BOM000014	0	原味传统奶豆腐/成品袋装	SP0000046	150	袋		1	2026-04-01 15:07:20.27115	2026-04-01 15:07:20.27115	\N
15	BOM000015	0	蒙古黄油/瓶装成品	SP0000045	100克	瓶		1	2026-04-01 15:07:22.997854	2026-04-01 15:07:22.997854	\N
16	BOM000016	0	新/青砖奶茶	SP0000054	16次泡	盒		1	2026-04-01 15:07:25.250954	2026-04-01 15:07:25.250954	\N
17	BOM000017	0	暂用/茶 新旧更替	SP0000058	1	盒		1	2026-04-01 15:07:27.63616	2026-04-01 15:07:27.63616	\N
18	BOM000018	0	甜味奶条成品	SP0000026	250克	袋		1	2026-04-01 15:07:30.46228	2026-04-01 15:07:30.46228	\N
19	BOM000019	0	原味奶条成品	SP0000027	250克	袋		1	2026-04-01 15:07:34.919879	2026-04-01 15:07:34.919879	\N
20	BOM000020	0	冻炒米成品盒	SP0000040	110克	盒		1	2026-04-01 15:07:36.138525	2026-04-01 15:07:36.138525	\N
21	BOM000021	0	青砖奶茶成品	SP0000038	16次泡	盒		1	2026-04-01 15:07:40.792612	2026-04-01 15:07:40.792612	\N
22	BOM000022	0	奶果子/盒装/成品	SP0000042	240克	盒		1	2026-04-01 15:07:45.112056	2026-04-01 15:07:45.112056	\N
\.


--
-- Data for Name: collect_receipt; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.collect_receipt (id, receipt_no, order_sn, customer_id, customer_name, contact_name, amount, receipt_date, pay_type, fund_id, fund_name, remark, status, created_at, deleted_at, category) FROM stdin;
\.


--
-- Data for Name: company_info; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.company_info (id, name, logo, address, tel, email, remark) FROM stdin;
1	牧区纯坊官方品牌店					
\.


--
-- Data for Name: depts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.depts (id, name, parent_id, sort, status, created_at) FROM stdin;
\.


--
-- Data for Name: finance_costs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_costs (id, cost_no, name, amount, cost_date, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: finance_expenses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_expenses (id, expense_no, name, amount, expense_date, fund_id, fund_name, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: finance_funds; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_funds (id, name, fund_type, balance, bank_name, bank_account, remark, status, create_time, update_time, deleted_at) FROM stdin;
40	科尔沁奶食品	2	13115.00				1	2026-04-01 01:41:25.234274	2026-04-01 01:41:25.234274	2026-04-03 10:06:21.551912
6	测试账户DELETE	1	0.00				1	2026-03-29 15:04:21.718196	2026-03-29 15:04:21.718196	2026-03-29 15:05:24.636888
5	道力干记录付款单	1	-205.00				1	2026-03-29 07:56:07.75335	2026-03-29 15:37:30.390586	\N
41	浙江金矿包装	2	5010.76				1	2026-04-01 01:41:30.624632	2026-04-01 01:41:30.624632	2026-04-03 10:06:22.105188
42	杂/采购商	2	593.36				1	2026-04-01 01:41:47.809639	2026-04-01 01:41:47.809639	2026-04-03 10:06:22.645469
43	奥都奶食品	2	1755.00				1	2026-04-01 01:41:52.19548	2026-04-01 01:41:52.19548	2026-04-03 10:06:23.216924
44	阿润查干	2	1244.00				1	2026-04-01 01:42:55.914895	2026-04-01 01:42:55.914895	2026-04-03 10:06:23.750295
45	茁硕乐/牛肉干	2	980.00				1	2026-04-01 01:43:28.037714	2026-04-01 01:43:28.037714	2026-04-03 10:06:24.314573
46	雷记炒货	2	300.00				1	2026-04-01 01:43:48.404603	2026-04-01 01:43:48.404603	2026-04-03 10:06:24.858895
47	糖炮	2	380.00				1	2026-04-01 01:43:54.525924	2026-04-01 01:43:54.525924	2026-04-03 10:06:25.461261
48	兴安盟杭盖奶制品厂	2	950.00				1	2026-04-01 01:43:59.903277	2026-04-01 01:43:59.903277	2026-04-03 10:06:26.066952
49	扎旗吉十奶制品	2	90.00				1	2026-04-01 01:44:12.504769	2026-04-01 01:44:12.504769	2026-04-03 10:06:26.607375
50	阿齐图/巴林右旗	2	1470.00				1	2026-04-01 01:44:14.584655	2026-04-01 01:44:14.584655	2026-04-03 10:06:27.157839
51	额吉伊德	2	161.00				1	2026-04-01 01:44:30.428536	2026-04-01 01:44:30.428536	2026-04-03 10:06:27.707888
10	乌日力格/额外支出	1	-11460.00				1	2026-03-29 15:38:12.808151	2026-03-29 15:38:16.346442	\N
17	银河包装	2	13214.10				1	2026-04-01 01:38:11.386958	2026-04-01 01:38:11.386958	2026-04-03 10:06:08.919212
18	盛大印刷	2	7677.78				1	2026-04-01 01:38:49.558648	2026-04-01 01:38:49.558648	2026-04-03 10:06:09.480587
9	乌日力格	1	-8611.00				1	2026-03-29 15:38:03.482551	2026-03-29 15:38:19.081903	\N
19	淘宝紫辰包装	2	260.00				1	2026-04-01 01:39:01.145132	2026-04-01 01:39:01.145132	2026-04-03 10:06:10.041447
8	孟根	1	-46129.25				1	2026-03-29 15:37:37.415389	2026-03-29 15:38:19.984219	\N
20	沈阳东源包材厂	2	2381.12				1	2026-04-01 01:39:07.239587	2026-04-01 01:39:07.239587	2026-04-03 10:06:10.592153
21	沈阳乾兴包装	2	254.80				1	2026-04-01 01:39:26.901642	2026-04-01 01:39:26.901642	2026-04-03 10:06:11.148388
22	淘宝/江苏永发玻璃制品厂	2	1385.10				1	2026-04-01 01:39:41.946062	2026-04-01 01:39:41.946062	2026-04-03 10:06:11.685737
52	奥特尔奶食品店	2	526.00				1	2026-04-01 01:44:32.50387	2026-04-01 01:44:32.50387	2026-04-03 10:06:28.251099
23	山东锦食食品	2	1630.18				1	2026-04-01 01:39:46.666249	2026-04-01 01:39:46.666249	2026-04-03 10:06:12.235733
53	沈阳包装	2	2785.97				1	2026-04-01 01:44:34.60976	2026-04-01 01:44:34.60976	2026-04-03 10:06:28.796527
54	小米厂家阿旗	2	573.00				1	2026-04-01 01:44:50.747105	2026-04-01 01:44:50.747105	2026-04-03 10:06:29.449655
24	拼多多/木勺	2	223.86				1	2026-04-01 01:39:50.433555	2026-04-01 01:39:50.433555	2026-04-03 10:06:12.785309
25	拼多多/热缩膜	2	635.49				1	2026-04-01 01:39:55.222563	2026-04-01 01:39:55.222563	2026-04-03 10:06:13.341214
26	翁牛特旗奶果子	2	8761.00				1	2026-04-01 01:40:04.375789	2026-04-01 01:40:04.375789	2026-04-03 10:06:13.888782
27	永巨茶业	2	7523.04				1	2026-04-01 01:40:11.132529	2026-04-01 01:40:11.132529	2026-04-03 10:06:14.442619
28	广州维记	2	11852.00				1	2026-04-01 01:40:14.196539	2026-04-01 01:40:14.196539	2026-04-03 10:06:14.990589
55	乌日汗奶食品店	2	90.00				1	2026-04-01 01:45:00.657664	2026-04-01 01:45:00.657664	2026-04-03 10:06:30.068682
29	恩赫奶制品厂	2	2260.80				1	2026-04-01 01:40:17.117109	2026-04-01 01:40:17.117109	2026-04-03 10:06:15.537509
30	优如包装	2	11900.02				1	2026-04-01 01:40:19.237933	2026-04-01 01:40:19.237933	2026-04-03 10:06:16.095313
31	巴音珠萨朗	2	2311.76				1	2026-04-01 01:40:22.880178	2026-04-01 01:40:22.880178	2026-04-03 10:06:16.651848
32	那牧尔乳制品厂/纯净之源	2	9949.00				1	2026-04-01 01:40:25.045286	2026-04-01 01:40:25.045286	2026-04-03 10:06:17.208939
33	淘宝欧信	2	1700.00				1	2026-04-01 01:40:33.363035	2026-04-01 01:40:33.363035	2026-04-03 10:06:17.747034
56	格日勒	2	100.00				1	2026-04-01 01:45:06.859374	2026-04-01 01:45:06.859374	2026-04-03 10:06:30.605775
34	锡盟艾润萨利SC	2	470.00				1	2026-04-01 01:40:38.405518	2026-04-01 01:40:38.405518	2026-04-03 10:06:18.288084
57	德吉奶食品	2	270.00				1	2026-04-01 01:45:18.58188	2026-04-01 01:45:18.58188	2026-04-03 10:06:31.1476
7	公司支出账户	1	-13007.38				1	2026-03-29 15:37:30.872532	2026-04-03 10:07:08.049376	\N
35	阿旗北方	2	63.30				1	2026-04-01 01:40:40.547541	2026-04-01 01:40:40.547541	2026-04-03 10:06:18.838344
36	拼多多/随机店采购	2	3087.24				1	2026-04-01 01:41:01.802908	2026-04-01 01:41:01.802908	2026-04-03 10:06:19.371705
37	民族印刷厂	2	192.00				1	2026-04-01 01:41:11.181848	2026-04-01 01:41:11.181848	2026-04-03 10:06:19.917713
38	淘宝/杂	2	1850.00				1	2026-04-01 01:41:15.437281	2026-04-01 01:41:15.437281	2026-04-03 10:06:20.47073
39	纯净奶食品	2	21510.60				1	2026-04-01 01:41:22.119502	2026-04-01 01:41:22.119502	2026-04-03 10:06:21.01012
\.


--
-- Data for Name: finance_invoices; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_invoices (id, invoice_no, customer_id, customer_name, amount, invoice_date, type, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: finance_payable; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_payable (id, supplier_id, supplier_name, order_sn, order_amount, paid_amount, un_pay_amount, due_date, status, created_at) FROM stdin;
\.


--
-- Data for Name: finance_receivable; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_receivable (id, customer_id, customer_name, order_sn, total_amount, paid_amount, un_pay_amount, due_date, status, created_at) FROM stdin;
\.


--
-- Data for Name: finance_statements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_statements (id, statement_no, customer_id, customer_name, amount, start_date, end_date, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: goods; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods (id, name, code, cate_id, cate_name, unit_id, unit_name, brand_id, brand_name, spec, price, cost, stock, min_stock, max_stock, remark, status, images, create_time, update_time, deleted_at, goods_name, goods_sn, en_name, goods_memo, goods_type, sell_price, cost_price, barcode, safe_min, safe_max, sort, make_time, can_sale, can_buy, can_make, can_outsource, multi_unit, multi_spec) FROM stdin;
803			167	广告物料	0	散	0		散	0.00	0.00	0	0	0		1		2026-03-29 06:45:50.485118	2026-03-29 06:45:50.485118	\N	炒米/散/巴林	SP0000233			1	7.00	0.00		0	0	0	0	1	1	1	1	f	f
804			167	广告物料	0	瓶	0		1L	0.00	0.00	0	0	0		1		2026-03-29 06:45:51.478038	2026-03-29 06:45:51.478038	\N	德吉酸奶/2斤装	SP0000232			1	18.00	15.00	6900002324565	0	0	0	0	1	1	1	1	f	f
805			167	广告物料	0	瓶	0		500mL	0.00	0.00	0	0	0		1		2026-03-29 06:45:52.387318	2026-03-29 06:45:52.387318	\N	德吉酸奶/一斤装	SP0000231			1	12.00	8.00	6954129710171	0	0	0	0	1	1	1	1	f	f
806			167	广告物料	0	瓶	0		250mL	0.00	0.00	0	0	0		1		2026-03-29 06:45:53.28094	2026-03-29 06:45:53.28094	\N	德吉酸奶/半斤	SP0000230			1	8.00	4.00		0	0	0	0	1	1	1	1	f	f
807			170	成品	0	袋	0		250克	0.00	0.00	0	0	0		1		2026-03-29 06:45:55.547042	2026-03-29 06:45:55.547042	\N	蒙古果/格日勒/大	SP0000229			1	16.00	12.00	6926743385045	0	0	0	0	1	1	1	1	f	f
808			167	广告物料	0	盒	0		100克	0.00	0.00	0	0	0		1		2026-03-29 06:45:56.452492	2026-03-29 06:45:56.452492	\N	彩色奶圈圈	SP0000228			1	15.00	0.00		0	0	0	0	1	1	1	1	f	f
809			170	成品	0	盒	0		10斤装	0.00	0.00	0	0	0		1		2026-03-29 06:45:57.423231	2026-03-29 06:45:57.423231	\N	10斤装/小米/绿色纸盒	SP0000227			1	70.00	65.00		0	0	0	0	1	1	1	1	f	f
810			168	散货	0	散	0		1斤装	0.00	0.00	0	0	0		1		2026-03-29 06:45:58.352636	2026-03-29 06:45:58.352636	\N	乌日莫/奥特尔	SP0000226			1	15.00	12.00		0	0	0	0	1	1	1	1	f	f
811			167	广告物料	0	袋	0		250克	0.00	0.00	0	0	0		1		2026-03-29 06:45:59.242186	2026-03-29 06:45:59.242186	\N	蒙古果子/格日勒	SP0000225			1	10.00	8.00		0	0	0	0	1	1	1	1	f	f
812			167	广告物料	0	散	0		散	0.00	0.00	0	0	0		1		2026-03-29 06:46:00.138942	2026-03-29 06:46:00.138942	\N	花形奶锅巴	SP0000224			1	35.00	0.00		0	0	0	0	1	1	1	1	f	f
813			167	广告物料	0	张	0		大	0.00	0.00	0	0	0		1		2026-03-29 06:46:01.045929	2026-03-29 06:46:01.045929	\N	奶豆腐/超大/乌日汗	SP0000223			1	85.00	60.00	6900002239603	0	0	0	0	1	1	1	1	f	f
814			167	广告物料	0	袋	0		1斤/原味	0.00	0.00	0	0	0		1		2026-03-29 06:46:01.987682	2026-03-29 06:46:01.987682	\N	奥都/真空奶豆腐	SP0000222			1	25.00	0.00		0	0	0	0	1	1	1	1	f	f
815			170	成品	0	瓶	0		大	0.00	0.00	0	0	0		1		2026-03-29 06:46:03.381383	2026-03-29 06:46:03.381383	\N	酸马奶	SP0000221			1	25.00	15.00	6900002213934	0	0	0	0	1	1	1	1	f	f
816			170	成品	0	瓶	0		大	0.00	0.00	0	0	0		1		2026-03-29 06:46:04.950399	2026-03-29 06:46:04.950399	\N	乌日汗大瓶酸奶	SP0000220			1	20.00	16.00	6900002209130	0	0	0	0	1	1	1	1	f	f
817			170	成品	0	瓶	0		小	0.00	0.00	0	0	0		1		2026-03-29 06:46:05.861995	2026-03-29 06:46:05.861995	\N	乌日汗小瓶酸奶	SP0000219			1	8.00	6.00	6903547102122	0	0	0	0	1	1	1	1	f	f
818			171	酒	0	件	0		500ML*4	0.00	0.00	0	0	0		1		2026-03-29 06:46:07.26264	2026-03-29 06:46:07.26264	\N	四季红福	SP0000218			1	120.00	100.00		0	0	0	0	1	1	1	1	f	f
819			171	酒	0	桶	0		2L	0.00	0.00	0	0	0		1		2026-03-29 06:46:08.168863	2026-03-29 06:46:08.168863	\N	红日桶装酒	SP0000217			1	28.00	21.00		0	0	0	0	1	1	1	1	f	f
820			171	酒	0	瓶	0		490mL	0.00	0.00	0	0	0		1		2026-03-29 06:46:09.089646	2026-03-29 06:46:09.089646	\N	天山原浆/小	SP0000216			1	15.00	9.23	6900002169910	0	0	0	0	1	1	1	1	f	f
821			171	酒	0	瓶	0		490mL	0.00	0.00	0	0	0		1		2026-03-29 06:46:10.042136	2026-03-29 06:46:10.042136	\N	天山原浆/大	SP0000215			1	25.00	16.05	6926919861169	0	0	0	0	1	1	1	1	f	f
822			167	广告物料	0	瓶	0		半斤装	0.00	0.00	0	0	0		1		2026-03-29 06:46:10.970494	2026-03-29 06:46:10.970494	\N	黄油/大瓶/科尔沁	SP0000214			1	30.00	21.00	6907262383018	0	0	0	0	1	1	1	1	f	f
823			167	广告物料	0	瓶	0		半斤装	0.00	0.00	0	0	0		1		2026-03-29 06:46:11.874816	2026-03-29 06:46:11.874816	\N	黄油/中瓶	SP0000213			1	25.00	15.00		0	0	0	0	1	1	1	1	f	f
824			172	散装	0	散	0		散	0.00	0.00	0	0	0		1		2026-03-29 06:46:13.346968	2026-03-29 06:46:13.346968	\N	黄油/散装	SP0000212			1	48.00	22.00		0	0	0	0	1	1	1	1	f	f
825			172	散装	0	盒	0		300ml	0.00	0.00	0	0	0		1		2026-03-29 06:46:14.691322	2026-03-29 06:46:14.691322	\N	故乡宝酸马奶	SP0000211			1	18.00	15.00		0	0	0	0	1	1	1	1	f	f
826			172	散装	0	盒	0		500克	0.00	0.00	0	0	0		1		2026-03-29 06:46:15.715184	2026-03-29 06:46:15.715184	\N	乌日汗酸奶	SP0000210			1	15.00	9.00	6900002102839	0	0	0	0	1	1	1	1	f	f
827			175	成品	0	盒	0		200克	0.00	0.00	0	0	0		1		2026-03-29 06:46:18.023543	2026-03-29 06:46:18.023543	\N	透明成品/奶锅巴/线下	SP0000209			1	27.00	0.00		0	0	0	0	1	1	1	1	f	f
828			167	广告物料	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:46:18.944102	2026-03-29 06:46:18.944102	\N	中等/奶豆腐/	SP0000208			1	32.00	0.00		0	0	0	0	1	1	1	1	f	f
829			167	广告物料	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:46:19.857632	2026-03-29 06:46:19.857632	\N	奶豆腐/原味/中/科尔沁	SP0000207			1	25.00	19.00		0	0	0	0	1	1	1	1	f	f
830			167	广告物料	0	袋	0		2.5kg	0.00	0.00	0	0	0		1		2026-03-29 06:46:20.776315	2026-03-29 06:46:20.776315	\N	小米/10斤/小袋	SP0000206			1	22.00	19.00		0	0	0	0	1	1	1	1	f	f
831			170	成品	0	袋	0		1斤装	0.00	0.00	0	0	0		1		2026-03-29 06:46:21.672573	2026-03-29 06:46:21.672573	\N	果条/阿润	SP0000205			1	12.00	10.00		0	0	0	0	1	1	1	1	f	f
832			167	广告物料	0	袋	0		100克	0.00	0.00	0	0	0		1		2026-03-29 06:46:22.622511	2026-03-29 06:46:22.622511	\N	8元烤奶皮/成品	SP0000204			1	8.00	0.00		0	0	0	0	1	1	1	1	f	f
833			170	成品	0	袋	0		180	0.00	0.00	0	0	0		1		2026-03-29 06:46:23.576842	2026-03-29 06:46:23.576842	\N	10元/脆香奶条	SP0000203			1	10.00	0.00		0	0	0	0	1	1	1	1	f	f
834			167	广告物料	0	袋	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:46:24.537651	2026-03-29 06:46:24.537651	\N	新年福字袋/小	SP0000202			1	0.00	0.22		0	0	0	0	1	1	1	1	f	f
835			170	成品	0	散	0		散装	0.00	0.00	0	0	0		1		2026-03-29 06:46:25.464428	2026-03-29 06:46:25.464428	\N	奶果子/小包装/成品	SP0000200			1	50.00	0.00		0	0	0	0	1	1	1	1	f	f
836			178	塑料袋	0	个	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:46:29.95024	2026-03-29 06:46:29.95024	\N	礼盒/2026	SP0000199			1	8.00	5.16		0	0	0	0	1	1	1	1	f	f
837			172	散装	0	袋	0		1一斤	0.00	0.00	0	0	0		1		2026-03-29 06:46:31.020745	2026-03-29 06:46:31.020745	\N	甜味奶豆腐块儿/大	SP0000198			1	35.00	28.00		0	0	0	0	1	1	1	1	f	f
838			180	成品	0	袋	0		2斤装	0.00	0.00	0	0	0		1		2026-03-29 06:46:32.937152	2026-03-29 06:46:32.937152	\N	奶粉蒙古国	SP0000197			1	36.00	32.00		0	0	0	0	1	1	1	1	f	f
839			180	成品	0	袋	0		360克	0.00	0.00	0	0	0		1		2026-03-29 06:46:34.281064	2026-03-29 06:46:34.281064	\N	奶皮子粉	SP0000196			1	16.00	12.00		0	0	0	0	1	1	1	1	f	f
840			180	成品	0	盒	0		300克	0.00	0.00	0	0	0		1		2026-03-29 06:46:35.18057	2026-03-29 06:46:35.18057	\N	奶茶粉战粮	SP0000195			1	20.00	15.00		0	0	0	0	1	1	1	1	f	f
842			180	成品	0	袋	0		400克	0.00	0.00	0	0	0		1		2026-03-29 06:46:37.067494	2026-03-29 06:46:37.067494	\N	努德勒沁调和茶	SP0000193			1	25.00	22.00		0	0	0	0	1	1	1	1	f	f
844			180	成品	0	盒	0		400克	0.00	0.00	0	0	0		1		2026-03-29 06:46:38.927496	2026-03-29 06:46:38.927496	\N	希日嘎拉奶茶专用茶	SP0000191			1	25.00	22.00		0	0	0	0	1	1	1	1	f	f
846			167	广告物料	0	瓶	0		250克	0.00	0.00	0	0	0		1		2026-03-29 06:46:40.760643	2026-03-29 06:46:40.760643	\N	酸奶/额吉伊德	SP0000189			1	10.00	6.00		0	0	0	0	1	1	1	1	f	f
848			181	糖果sugar	0	袋	0		净含量172	0.00	0.00	0	0	0		1		2026-03-29 06:46:43.034656	2026-03-29 06:46:43.034656	\N	10元组合糖	SP0000187			1	10.00	6.00	6945391354769	0	0	0	0	1	1	1	1	f	f
850			184	袋子	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:46:46.288178	2026-03-29 06:46:46.288178	\N	红糖袋/delicious	SP0000185			1	0.00	0.00		0	0	0	0	1	1	1	1	f	f
851			170	成品	0	盒	0		3根	0.00	0.00	0	0	0		1		2026-03-29 06:46:47.22213	2026-03-29 06:46:47.22213	\N	晴王糖葫芦	SP0000184			1	0.00	0.00	6957075066268	0	0	0	0	1	1	1	1	f	f
853			170	成品	0	斤	0		香辣	0.00	0.00	0	0	0		1		2026-03-29 06:46:49.040653	2026-03-29 06:46:49.040653	\N	牛肉干/散/香辣	SP0000182			1	115.00	98.00	6900002054622	0	0	0	0	1	1	1	1	f	f
855			167	广告物料	0	散	0		散	0.00	0.00	0	0	0		1		2026-03-29 06:46:50.934138	2026-03-29 06:46:50.934138	\N	奶锅巴/扎旗吉十奶制品	SP0000180			1	28.00	18.00	6937111207251	0	0	0	0	1	1	1	1	f	f
857			167	广告物料	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:46:52.743295	2026-03-29 06:46:52.743295	\N	厚奶皮	SP0000178			1	25.00	19.00		0	0	0	0	1	1	1	1	f	f
859			181	糖果sugar	0	斤	0		奶油炒米/  黑芝麻/ 乌日莫糖/ 酸奶炒米/ 奶油花生	0.00	0.00	0	0	0		1		2026-03-29 06:46:54.595963	2026-03-29 06:46:54.595963	\N	糖/阿润	SP0000176			1	35.00	25.00		0	0	0	0	1	1	1	1	f	f
861			172	散装	0	散	0		散称	0.00	0.00	0	0	0		1		2026-03-29 06:46:56.438149	2026-03-29 06:46:56.438149	\N	五香瓜子	SP0000174			1	18.00	15.00	6900001763790	0	0	0	0	1	1	1	1	f	f
863			172	散装	0	个	0		7克/包	0.00	0.00	0	0	0		1		2026-03-29 06:47:00.700348	2026-03-29 06:47:00.700348	\N	冻炒米/小包散/精品	SP0000172			1	0.00	0.22	6922984070163	0	0	0	0	1	1	1	1	f	f
865			170	成品	0	袋	0		250克	0.00	0.00	0	0	0		1		2026-03-29 06:47:02.573843	2026-03-29 06:47:02.573843	\N	牛肉干/和希格图	SP0000170			1	89.00	49.00	6906087912087	0	0	0	0	1	1	1	1	f	f
874			193	成品	0	袋	0		140克	0.00	0.00	0	0	0		1		2026-03-29 06:47:13.890147	2026-03-29 06:47:13.890147	\N	黄金纬度/牛肉干/成品袋	SP0000161			1	118.00	48.95		0	0	0	0	1	1	1	1	f	f
875			196	定制类产品	0	盒	0		140g	0.00	0.00	0	0	0		1		2026-03-29 06:47:16.184249	2026-03-29 06:47:16.184249	\N	憨野/冻炒米	SP0000160			1	23.50	4.48	6993375937417	0	0	0	0	1	1	1	1	f	f
877			196	定制类产品	0	盒	0		120g/憨野	0.00	0.00	0	0	0		1		2026-03-29 06:47:18.386251	2026-03-29 06:47:18.386251	\N	憨野/奶锅巴/	SP0000158			1	27.00	5.28	6900001584957	0	0	0	0	1	1	1	1	f	f
871			180	成品	0	个	0		380g	0.00	0.00	0	0	0		1		2026-03-29 06:47:08.101844	2026-04-02 02:58:50.035782	\N	小青砖茶砖	SP0000164			1	12.00	7.11	6928141402320	0	0	0	0	1	1	1	1	t	f
869			180	成品	0	袋	0		450g	0.00	0.00	0	0	0		1		2026-03-29 06:47:06.260498	2026-04-02 02:58:56.312265	\N	青砖碎茶	SP0000166			1	12.00	7.31		0	0	0	0	1	1	1	1	t	f
867			180	成品	0	盒	0		5g/袋泡茶/30泡	0.00	0.00	0	0	0		1		2026-03-29 06:47:04.41107	2026-04-02 02:59:03.608039	\N	5g/青砖袋泡茶	SP0000168			1	28.00	7.96	6980240258574	0	0	0	0	1	1	1	1	t	f
841			180	成品	0	袋	0		400克	0.00	0.00	0	0	0		1		2026-03-29 06:46:36.092855	2026-03-29 06:46:36.092855	\N	奶茶粉贡格尔	SP0000194			1	22.00	18.00		0	0	0	0	1	1	1	1	f	f
843			172	散装	0	袋	0		400克	0.00	0.00	0	0	0		1		2026-03-29 06:46:38.007844	2026-03-29 06:46:38.007844	\N	阿依古丽奶茶专用红茶	SP0000192			1	0.00	0.00		0	0	0	0	1	1	1	1	f	f
845			167	广告物料	0	瓶	0		250克	0.00	0.00	0	0	0		1		2026-03-29 06:46:39.821893	2026-03-29 06:46:39.821893	\N	乳清饮料	SP0000190			1	6.00	4.50	6943774380698	0	0	0	0	1	1	1	1	f	f
847			170	成品	0	袋	0		500克	0.00	0.00	0	0	0		1		2026-03-29 06:46:41.675045	2026-03-29 06:46:41.675045	\N	乌日莫/袋装	SP0000188			1	10.00	7.00		0	0	0	0	1	1	1	1	f	f
849			181	糖果sugar	0	袋	0		净含量172	0.00	0.00	0	0	0		1		2026-03-29 06:46:43.975249	2026-03-29 06:46:43.975249	\N	15元组合糖	SP0000186			1	15.00	8.60		0	0	0	0	1	1	1	1	f	f
852			170	成品	0	斤	0		孜然	0.00	0.00	0	0	0		1		2026-03-29 06:46:48.134464	2026-03-29 06:46:48.134464	\N	牛肉干/散/孜然	SP0000183			1	115.00	98.00	6961257264978	0	0	0	0	1	1	1	1	f	f
854			170	成品	0	斤	0		原味	0.00	0.00	0	0	0		1		2026-03-29 06:46:49.989028	2026-03-29 06:46:49.989028	\N	牛肉干/散/原味	SP0000181			1	115.00	98.00	6939980951432	0	0	0	0	1	1	1	1	f	f
856			170	成品	0	张	0		1.2	0.00	0.00	0	0	0		1		2026-03-29 06:46:51.851488	2026-03-29 06:46:51.851488	\N	科尔沁/大奶豆腐	SP0000179			1	48.00	33.00	6974218180685	0	0	0	0	1	1	1	1	f	f
858			170	成品	0	盒	0		3棵	0.00	0.00	0	0	0		1		2026-03-29 06:46:53.65596	2026-03-29 06:46:53.65596	\N	糖葫芦	SP0000177			1	10.00	6.00	6963465779827	0	0	0	0	1	1	1	1	f	f
860			172	散装	0	散	0		散称	0.00	0.00	0	0	0		1		2026-03-29 06:46:55.53842	2026-03-29 06:46:55.53842	\N	普通瓜子	SP0000175			1	12.00	10.00	6915044718067	0	0	0	0	1	1	1	1	f	f
862			187	黄油	0	瓶	0		120mL	0.00	0.00	0	0	0		1		2026-03-29 06:46:59.307415	2026-03-29 06:46:59.307415	\N	专瓶/黄油渣	SP0000173			1	0.00	1.80		0	0	0	0	1	1	1	1	f	f
864			178	塑料袋	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:47:01.663181	2026-03-29 06:47:01.663181	\N	礼盒/腰封	SP0000171			1	0.50	0.37		0	0	0	0	1	1	1	1	f	f
866			170	成品	0	瓶	0		400ke	0.00	0.00	0	0	0		1		2026-03-29 06:47:03.500209	2026-03-29 06:47:03.500209	\N	酸奶/纯净	SP0000169			1	12.00	6.00		0	0	0	0	1	1	1	1	f	f
873			192	牛肉干	0	袋	0		140克	0.00	0.00	0	0	0		1		2026-03-29 06:47:12.37242	2026-03-29 06:47:12.37242	\N	专袋/牛肉干包装	SP0000162			1	0.00	1.47	6980832219752	0	0	0	0	1	1	1	1	f	f
876			196	定制类产品	0	盒	0		120g	0.00	0.00	0	0	0		1		2026-03-29 06:47:17.101234	2026-03-29 06:47:17.101234	\N	憨野/奶条	SP0000159			1	16.00	4.08		0	0	0	0	1	1	1	1	f	f
878			170	成品	0	盒	0		1一斤装	0.00	0.00	0	0	0		1		2026-03-29 06:47:19.354998	2026-03-29 06:47:19.354998	\N	羊奶粉/1斤	SP0000157			1	18.00	12.50		0	0	0	0	1	1	1	1	f	f
879			167	广告物料	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:47:20.325013	2026-03-29 06:47:20.325013	\N	干肉奶茶	SP0000156			1	15.00	5.50	6982118636994	0	0	0	0	1	1	1	1	f	f
880			170	成品	0	袋	0		4颗/350克	0.00	0.00	0	0	0		1		2026-03-29 06:47:21.300867	2026-03-29 06:47:21.300867	\N	阿润月饼/五仁馅	SP0000155			1	15.00	10.00		0	0	0	0	1	1	1	1	f	f
881			170	成品	0	袋	0		4颗/350克	0.00	0.00	0	0	0		1		2026-03-29 06:47:22.211561	2026-03-29 06:47:22.211561	\N	阿润月饼/奶皮子馅	SP0000154			1	15.00	10.00		0	0	0	0	1	1	1	1	f	f
882			170	成品	0	袋	0		4颗/350克	0.00	0.00	0	0	0		1		2026-03-29 06:47:23.133723	2026-03-29 06:47:23.133723	\N	阿润月饼/黄油渣馅	SP0000153			1	15.00	10.00		0	0	0	0	1	1	1	1	f	f
883			170	成品	0	袋	0		4颗/350克	0.00	0.00	0	0	0		1		2026-03-29 06:47:24.030271	2026-03-29 06:47:24.030271	\N	阿润月饼/奶豆腐馅	SP0000152			1	15.00	10.00	6922814823197	0	0	0	0	1	1	1	1	f	f
884			170	成品	0	个	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:47:24.971807	2026-03-29 06:47:24.971807	\N	实惠/奶豆腐	SP0000151			1	20.00	12.00	6900001519215	0	0	0	0	1	1	1	1	f	f
885			172	散装	0	斤	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:47:25.913003	2026-03-29 06:47:25.913003	\N	冻炒米/散装	SP0000150			1	25.00	16.00	6900001505720	0	0	0	0	1	1	1	1	f	f
886			170	成品	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:47:26.803653	2026-03-29 06:47:26.803653	\N	冻炒米/科尔沁	SP0000149			1	12.00	7.00	6900001499679	0	0	0	0	1	1	1	1	f	f
887			170	成品	0	盒	0		320克	0.00	0.00	0	0	0		1		2026-03-29 06:47:27.782543	2026-03-29 06:47:27.782543	\N	羊乳奶粉/奶茶专用	SP0000148			1	32.00	25.00	6900001481464	0	0	0	0	1	1	1	1	f	f
888			170	成品	0	盒	0		320克	0.00	0.00	0	0	0		1		2026-03-29 06:47:29.077221	2026-03-29 06:47:29.077221	\N	河套奶粉	SP0000147			1	18.00	14.00	6900001473306	0	0	0	0	1	1	1	1	f	f
889			170	成品	0	盒	0		1盒	0.00	0.00	0	0	0		1		2026-03-29 06:47:30.038654	2026-03-29 06:47:30.038654	\N	奶皮卷/科尔沁	SP0000146			1	30.00	15.00	6900001463143	0	0	0	0	1	1	1	1	f	f
890			172	散装	0	斤	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:47:30.97204	2026-03-29 06:47:30.97204	\N	红枣	SP0000145			1	18.00	12.00	6900001459821	0	0	0	0	1	1	1	1	f	f
891			198	供货品	0	小包	0		80克	0.00	0.00	0	0	0		1		2026-03-29 06:47:32.872859	2026-03-29 06:47:32.872859	\N	芝士奶豆腐月饼	SP0000144			1	8.00	5.00	6900001442932	0	0	0	0	1	1	1	1	f	f
892			198	供货品	0	盒	0		250	0.00	0.00	0	0	0		1		2026-03-29 06:47:34.284505	2026-03-29 06:47:34.284505	\N	那牧尔酸奶	SP0000143			1	8.00	4.00	6900001436777	0	0	0	0	1	1	1	1	f	f
893			198	供货品	0	小包	0		80克	0.00	0.00	0	0	0		1		2026-03-29 06:47:35.211921	2026-03-29 06:47:35.211921	\N	奶豆腐月饼	SP0000142			1	8.00	5.00	6900001427497	0	0	0	0	1	1	1	1	f	f
894			198	供货品	0	小包	0		80克	0.00	0.00	0	0	0		1		2026-03-29 06:47:36.135289	2026-03-29 06:47:36.135289	\N	酸奶月饼	SP0000141			1	8.00	5.00	6900001418318	0	0	0	0	1	1	1	1	f	f
895			198	供货品	0	小包	0		80克	0.00	0.00	0	0	0		1		2026-03-29 06:47:37.070662	2026-03-29 06:47:37.070662	\N	黄油渣月饼	SP0000140			1	8.00	5.00	6900001407174	0	0	0	0	1	1	1	1	f	f
870			180	成品	0	个	0		1.5kg	0.00	0.00	0	0	0		1		2026-03-29 06:47:07.159071	2026-04-02 02:58:53.102631	\N	大青砖茶砖	SP0000165			1	35.00	22.75	6910261376045	0	0	0	0	1	1	1	1	t	f
868			180	成品	0	袋	0		450g/25袋	0.00	0.00	0	0	0		1		2026-03-29 06:47:05.316893	2026-04-02 02:58:59.068469	\N	16g青砖袋泡茶	SP0000167			1	18.00	10.24	6974109183959	0	0	0	0	1	1	1	1	t	f
896			198	供货品	0	小包	0		80克	0.00	0.00	0	0	0		1		2026-03-29 06:47:37.982567	2026-03-29 06:47:37.982567	\N	奶皮月饼	SP0000139			1	8.00	5.00	6900001399224	0	0	0	0	1	1	1	1	f	f
898			199	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-29 06:47:40.504891	2026-03-29 06:47:40.504891	\N	透专标签/奶皮千层	SP0000137			1	0.00	0.07	6900001376529	0	0	0	0	1	1	1	1	f	f
899			170	成品	0	瓶	0		1斤装	0.00	0.00	0	0	0		1		2026-03-29 06:47:41.411767	2026-03-29 06:47:41.411767	\N	纯净/黄油/斤	SP0000136			1	35.00	22.00	6900001367517	0	0	0	0	1	1	1	1	f	f
901			172	散装	0	麻袋	0		1斤	0.00	0.00	0	0	0		1		2026-03-29 06:47:43.221915	2026-03-29 06:47:43.221915	\N	手工白花炒米/散装	SP0000134			1	7.00	5.37	6900001345795	0	0	0	0	1	1	1	1	f	f
903			170	成品	0	袋	0		500g	0.00	0.00	0	0	0		1		2026-03-29 06:47:45.154085	2026-03-29 06:47:45.154085	\N	盛宇燃奶豆腐/甜味	SP0000132			1	26.00	19.00	6900001329621	0	0	0	0	1	1	1	1	f	f
906			170	成品	0	袋	0		500g	0.00	0.00	0	0	0		1		2026-03-29 06:47:47.908082	2026-03-29 06:47:47.908082	\N	真空奶豆腐砖/原味	SP0000129			1	26.00	17.00	6900001297957	0	0	0	0	1	1	1	1	f	f
908			170	成品	0	袋	0		1斤	0.00	0.00	0	0	0		1		2026-03-29 06:47:49.741949	2026-03-29 06:47:49.741949	\N	哈斯乌拉牛肉干500g原味	SP0000127			1	98.00	83.00	6900001278368	0	0	0	0	1	1	1	1	f	f
910			181	糖果sugar	0	袋	0		270	0.00	0.00	0	0	0		1		2026-03-29 06:47:51.965511	2026-03-29 06:47:51.965511	\N	蓝旗绿乳糖奶香酥	SP0000125			1	6.00	4.00	6900001257630	0	0	0	0	1	1	1	1	f	f
912			181	糖果sugar	0	袋	0		270	0.00	0.00	0	0	0		1		2026-03-29 06:47:53.899291	2026-03-29 06:47:53.899291	\N	蓝旗绿乳糖水果	SP0000123			1	6.00	4.00	6900001238866	0	0	0	0	1	1	1	1	f	f
915			170	成品	0	盒	0		250克	0.00	0.00	0	0	0		1		2026-03-29 06:47:56.98916	2026-03-29 06:47:56.98916	\N	黄油渣/盒	SP0000120			1	12.00	8.00	6900001205597	0	0	0	0	1	1	1	1	f	f
917			172	散装	0	斤	0		斤	0.00	0.00	0	0	0		1		2026-03-29 06:47:58.885589	2026-03-29 06:47:58.885589	\N	机器乌日末液体	SP0000118			1	15.00	9.00	6900001182829	0	0	0	0	1	1	1	1	f	f
919			170	成品	0	瓶	0		400克	0.00	0.00	0	0	0		1		2026-03-29 06:48:00.739062	2026-03-29 06:48:00.739062	\N	黄油/斤	SP0000116			1	26.00	20.00	6900001162463	0	0	0	0	1	1	1	1	f	f
924			170	成品	0	袋	0		300克	0.00	0.00	0	0	0		1		2026-03-29 06:48:05.452649	2026-03-29 06:48:05.452649	\N	冻炒米/袋装	SP0000111			1	12.00	8.00	6900001115240	0	0	0	0	1	1	1	1	f	f
926			172	散装	0	个	0		1斤2两	0.00	0.00	0	0	0		1		2026-03-29 06:48:07.413569	2026-03-29 06:48:07.413569	\N	大奶豆腐砖/1.2斤	SP0000109			1	35.00	25.00	6900001096391	0	0	0	0	1	1	1	1	f	f
928			178	塑料袋	0	袋	0		大/中/小	0.00	0.00	0	0	0		1		2026-03-29 06:48:09.276363	2026-03-29 06:48:09.276363	\N	塑料购物袋	SP0000107			1	0.00	0.00	6900001075048	0	0	0	0	1	1	1	1	f	f
930			170	成品	0	袋	0		500克	0.00	0.00	0	0	0		1		2026-03-29 06:48:11.17935	2026-03-29 06:48:11.17935	\N	加沙奶豆腐	SP0000105			1	16.00	12.00	6973630778288	0	0	0	0	1	1	1	1	f	f
932			170	成品	0	袋	0		500克	0.00	0.00	0	0	0		1		2026-03-29 06:48:13.155796	2026-03-29 06:48:13.155796	\N	炒米海丰	SP0000103			1	7.50	5.80	6958856810059	0	0	0	0	1	1	1	1	f	f
934			175	成品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-29 06:48:15.030001	2026-03-29 06:48:15.030001	\N	透明成品/奶皮千层/线下	SP0000101			1	26.60	0.00	6900001013558	0	0	0	0	1	1	1	1	f	f
936			175	成品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-29 06:48:16.97035	2026-03-29 06:48:16.97035	\N	透明成品/奶条/甜味/线下	SP0000099			1	22.00	0.00	6900000999855	0	0	0	0	1	1	1	1	f	f
938			175	成品	0	盒	0		140克	0.00	0.00	0	0	0		1		2026-03-29 06:48:18.849827	2026-03-29 06:48:18.849827	\N	透明成品/鲜奶酪/甜味/线下	SP0000097			1	29.80	0.00	6977375240277	0	0	0	0	1	1	1	1	f	f
923			172	散装	0	斤	0		10斤装/麻袋	0.00	0.00	0	0	0		1		2026-03-29 06:48:04.51461	2026-04-02 02:58:34.360399	\N	炒米/散装/硬口	SP0000112			1	7.50	4.80	6900001127456	0	0	0	0	1	1	1	1	t	f
921			181	糖果sugar	0	斤	0		1斤散称	0.00	0.00	0	0	0		1		2026-03-29 06:48:02.593872	2026-04-02 02:58:38.659322	\N	嚼口脆炒米糖/散装	SP0000114			1	25.00	15.00	6900001147035	0	0	0	0	1	1	1	1	t	f
897			198	供货品	0	袋	0		5	0.00	0.00	0	0	0		1		2026-03-29 06:47:39.086674	2026-03-29 06:47:39.086674	\N	早餐包/那牧尔	SP0000138			1	15.00	10.00	6900001382864	0	0	0	0	1	1	1	1	f	f
900			199	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-29 06:47:42.322564	2026-03-29 06:47:42.322564	\N	透专标签/脆香奶条/微甜	SP0000135			1	0.00	0.37	6900001356463	0	0	0	0	1	1	1	1	f	f
904			170	成品	0	袋	0		500g	0.00	0.00	0	0	0		1		2026-03-29 06:47:46.093461	2026-03-29 06:47:46.093461	\N	盛宇燃奶豆腐/原味	SP0000131			1	26.00	19.00	6900001315573	0	0	0	0	1	1	1	1	f	f
905			170	成品	0	袋	0		500g	0.00	0.00	0	0	0		1		2026-03-29 06:47:47.007702	2026-03-29 06:47:47.007702	\N	真空奶豆腐砖/甜味	SP0000130			1	26.00	17.00	6900001305887	0	0	0	0	1	1	1	1	f	f
907			170	成品	0	袋	0		1斤	0.00	0.00	0	0	0		1		2026-03-29 06:47:48.812859	2026-03-29 06:47:48.812859	\N	风干牛肉500g大片	SP0000128			1	128.00	95.00	6900001286630	0	0	0	0	1	1	1	1	f	f
909			181	糖果sugar	0	袋	0		450g	0.00	0.00	0	0	0		1		2026-03-29 06:47:50.676924	2026-03-29 06:47:50.676924	\N	蓝旗绿乳糖惠虹糖	SP0000126			1	9.00	7.00	6900001262639	0	0	0	0	1	1	1	1	f	f
911			181	糖果sugar	0	袋	0		270	0.00	0.00	0	0	0		1		2026-03-29 06:47:52.948674	2026-03-29 06:47:52.948674	\N	蓝旗绿乳糖果仁酥	SP0000124			1	6.00	4.00	6900001241338	0	0	0	0	1	1	1	1	f	f
913			181	糖果sugar	0	袋	0		270	0.00	0.00	0	0	0		1		2026-03-29 06:47:54.788268	2026-03-29 06:47:54.788268	\N	蓝旗绿乳糖黄油球	SP0000122			1	6.00	4.00	6900001223574	0	0	0	0	1	1	1	1	f	f
914			181	糖果sugar	0	袋	0		270	0.00	0.00	0	0	0		1		2026-03-29 06:47:55.689564	2026-03-29 06:47:55.689564	\N	蓝旗绿乳糖炼乳	SP0000121			1	6.00	4.00	6900001214103	0	0	0	0	1	1	1	1	f	f
918			170	成品	0	瓶	0		半斤装	0.00	0.00	0	0	0		1		2026-03-29 06:47:59.814553	2026-03-29 06:47:59.814553	\N	黄油/半斤	SP0000117			1	16.00	11.00	6900001176074	0	0	0	0	1	1	1	1	f	f
920			172	散装	0	斤	0		斤	0.00	0.00	0	0	0		1		2026-03-29 06:48:01.691012	2026-03-29 06:48:01.691012	\N	手工乌日末液体	SP0000115			1	10.00	8.00	6900001151503	0	0	0	0	1	1	1	1	f	f
925			172	散装	0	个	0		1斤	0.00	0.00	0	0	0		1		2026-03-29 06:48:06.43905	2026-03-29 06:48:06.43905	\N	小/无印花/奶豆腐砖/1斤	SP0000110			1	32.00	20.00	6900001102849	0	0	0	0	1	1	1	1	f	f
927			172	散装	0	个	0		1斤	0.00	0.00	0	0	0		1		2026-03-29 06:48:08.309904	2026-03-29 06:48:08.309904	\N	小奶豆腐砖/1斤	SP0000108			1	30.00	20.00	6900001086128	0	0	0	0	1	1	1	1	f	f
929			170	成品	0	袋	0		400克	0.00	0.00	0	0	0		1		2026-03-29 06:48:10.195771	2026-03-29 06:48:10.195771	\N	白砂糖	SP0000106			1	5.00	3.50	6900001064304	0	0	0	0	1	1	1	1	f	f
931			170	成品	0	袋	0		500g	0.00	0.00	0	0	0		1		2026-03-29 06:48:12.214368	2026-03-29 06:48:12.214368	\N	炒米粉/aag	SP0000104			1	6.50	4.80	6900001043080	0	0	0	0	1	1	1	1	f	f
933			175	成品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-29 06:48:14.106114	2026-03-29 06:48:14.106114	\N	透明成品/奶条/原味/线下	SP0000102			1	22.00	0.00	6900001026070	0	0	0	0	1	1	1	1	f	f
935			175	成品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-29 06:48:16.074131	2026-03-29 06:48:16.074131	\N	透明成品/奶皮卷/线下	SP0000100			1	26.60	0.00	6900001005826	0	0	0	0	1	1	1	1	f	f
937			175	成品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-29 06:48:17.935558	2026-03-29 06:48:17.935558	\N	透明成品/鲜奶皮/线下	SP0000098			1	29.80	0.00	6900000986032	0	0	0	0	1	1	1	1	f	f
939			200	给组装好产品	0	盒	0		200克	0.00	0.00	0	0	0		1		2026-03-29 06:48:20.581591	2026-03-29 06:48:20.581591	\N	半成品/透明/原味/鲜奶酪	SP0000096			2	29.80	13.00	6900000966050	0	0	0	0	1	1	1	1	f	f
940			200	给组装好产品	0	盒	0		200克	0.00	0.00	0	0	0		1		2026-03-29 06:48:21.541764	2026-03-29 06:48:21.541764	\N	半成品/透明/甜味/鲜奶酪	SP0000095			2	29.80	13.00	6900000955561	0	0	0	0	1	1	1	1	f	f
941			175	成品	0	盒	0		140克	0.00	0.00	0	0	0		1		2026-03-29 06:48:22.463963	2026-03-29 06:48:22.463963	\N	透明成品/鲜奶酪/原味/线下	SP0000094			1	29.80	0.00	6900000947515	0	0	0	0	1	1	1	1	f	f
942			200	给组装好产品	0	盒	0		200克	0.00	0.00	0	0	0		1		2026-03-29 06:48:23.394765	2026-03-29 06:48:23.394765	\N	半成品/透明/甜味奶条	SP0000093			2	22.00	6.80	6900000935538	0	0	0	0	1	1	1	1	f	f
943			200	给组装好产品	0	盒	0		200克	0.00	0.00	0	0	0		1		2026-03-29 06:48:24.289833	2026-03-29 06:48:24.289833	\N	半成品/透明/原味奶条	SP0000092			2	22.00	7.20	6900000924342	0	0	0	0	1	1	1	1	f	f
944			200	给组装好产品	0	盒	0		150克	0.00	0.00	0	0	0		1		2026-03-29 06:48:25.20265	2026-03-29 06:48:25.20265	\N	半成品/透明/奶皮千层	SP0000091			2	25.60	12.00	6900000917840	0	0	0	0	1	1	1	1	f	f
945			200	给组装好产品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-29 06:48:26.204461	2026-03-29 06:48:26.204461	\N	半成品/透明/奶皮卷	SP0000090			2	26.60	13.00	6900000907890	0	0	0	0	1	1	1	1	f	f
946			200	给组装好产品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-29 06:48:27.116959	2026-03-29 06:48:27.116959	\N	半成品/透明/鲜奶皮	SP0000089			2	26.60	14.00	6900000899530	0	0	0	0	1	1	1	1	f	f
947			167	广告物料	0	张	0		价格/规格/不定	0.00	0.00	0	0	0		1		2026-03-29 06:48:27.999927	2026-03-29 06:48:27.999927	\N	展示用卡牌	SP0000088			1	0.00	0.00	6900000881797	0	0	0	0	1	1	1	1	f	f
948			184	袋子	0	张	0		250克装	0.00	0.00	0	0	0		1		2026-03-29 06:48:28.905411	2026-03-29 06:48:28.905411	\N	专袋/乌日莫	SP0000087			1	0.00	0.46	6900000874528	0	0	0	0	1	1	1	1	f	f
949			184	袋子	0	张	0		500克装	0.00	0.00	0	0	0		1		2026-03-29 06:48:29.858794	2026-03-29 06:48:29.858794	\N	专袋/乌日莫/炒米	SP0000086			1	0.00	0.79	6900000861218	0	0	0	0	1	1	1	1	f	f
950			199	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-29 06:48:30.827947	2026-03-29 06:48:30.827947	\N	透专标签/奶皮卷	SP0000085			1	0.00	0.37	6900000856863	0	0	0	0	1	1	1	1	f	f
951			199	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-29 06:48:32.155746	2026-03-29 06:48:32.155746	\N	透专标签/冻炒米	SP0000084			1	0.00	0.37	6900000847671	0	0	0	0	1	1	1	1	f	f
916			172	散装	0	盒	0		半斤	0.00	0.00	0	0	0		1		2026-03-29 06:47:57.888413	2026-04-02 02:58:40.902772	\N	脆奶条/散装/科尔沁	SP0000119			1	12.50	7.00	6900001196244	0	0	0	0	1	1	1	1	t	f
902			181	糖果sugar	0	斤	0		1斤散称	0.00	0.00	0	0	0		1		2026-03-29 06:47:44.189326	2026-04-02 02:58:43.807758	\N	乌日莫糖/散装	SP0000133			1	30.00	22.00	6900001338681	0	0	0	0	1	1	1	1	t	f
952			199	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-29 06:48:33.061995	2026-03-29 06:48:33.061995	\N	透专标签/奶酪/原味	SP0000083			1	0.00	0.37	6900000831130	0	0	0	0	1	1	1	1	f	f
954			199	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-29 06:48:34.870605	2026-03-29 06:48:34.870605	\N	透专标签/乳清奶条/甜味	SP0000081			1	0.00	0.05	6900000815004	0	0	0	0	1	1	1	1	f	f
956			199	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-29 06:48:36.709091	2026-03-29 06:48:36.709091	\N	透专标签/鲜奶皮	SP0000079			1	0.00	0.37	6900000794933	0	0	0	0	1	1	1	1	f	f
957			201	亚克力	0	盒	0		待包换/冻炒米 145X85X55	0.00	0.00	0	0	0		1		2026-03-29 06:48:38.085612	2026-03-29 06:48:38.085612	\N	大/长方/亚克力/待用	SP0000078			1	0.00	1.30	6900000782027	0	0	0	0	1	1	1	1	f	f
959			201	亚克力	0	盒	0		235X170X35	0.00	0.00	0	0	0		1		2026-03-29 06:48:40.035059	2026-03-29 06:48:40.035059	\N	大/牛薄脆盒/亚克力	SP0000076			1	0.00	2.60	6900000761425	0	0	0	0	1	1	1	1	f	f
961			201	亚克力	0	盒	0		182X120X28/烤奶豆腐片/奶皮卷	0.00	0.00	0	0	0		1		2026-03-29 06:48:41.925836	2026-03-29 06:48:41.925836	\N	扁盒/亚克力/带内托	SP0000074			1	0.00	1.75	6900000747152	0	0	0	0	1	1	1	1	f	f
962			201	亚克力	0	盒	0		85X85X63  鲜奶皮	0.00	0.00	0	0	0		1		2026-03-29 06:48:42.8266	2026-03-29 06:48:42.8266	\N	中/方形/亚克力盒/	SP0000072			1	2.50	0.85	6900000724486	0	0	0	0	1	1	1	1	f	f
964			175	成品	0	盒	0		140克	0.00	0.00	0	0	0		1		2026-03-29 06:48:44.692601	2026-03-29 06:48:44.692601	\N	透明成品/冻炒米/线下	SP0000070			1	23.50	0.00	6900000709295	0	0	0	0	1	1	1	1	f	f
966			202	散小包装	0	小包	0		50克	0.00	0.00	0	0	0		1		2026-03-29 06:48:47.671566	2026-03-29 06:48:47.671566	\N	查嘎粉/小包装袋	SP0000068			1	5.00	3.00	6900000686492	0	0	0	0	1	1	1	1	f	f
968			172	散装	0	张	0		150-180克	0.00	0.00	0	0	0		1		2026-03-29 06:48:49.50128	2026-03-29 06:48:49.50128	\N	大/奶皮	SP0000066			1	20.00	13.00	6900000661992	0	0	0	0	1	1	1	1	f	f
970			170	成品	0	盒	0		200克	0.00	0.00	0	0	0	供货价13	1		2026-03-29 06:48:51.325392	2026-03-29 06:48:51.325392	\N	热奶豆腐碗	SP0000064			1	15.00	10.00	6900000642521	0	0	0	0	1	1	1	1	f	f
972			172	散装	0	斤	0		45散称/斤/9元/100克	0.00	0.00	0	0	0		1		2026-03-29 06:48:53.114651	2026-03-29 06:48:53.114651	\N	原味/散称/奶豆腐块儿	SP0000062			1	70.00	45.00	6900000623124	0	0	0	0	1	1	1	1	f	f
978			205	青砖奶茶	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:00.454145	2026-03-29 06:49:00.454145	\N	新茶专用标签纸	SP0000056			1	0.00	0.05	6900000561600	0	0	0	0	1	1	1	1	f	f
980			193	成品	0	盒	0		16次泡	0.00	0.00	0	0	0		1		2026-03-29 06:49:02.270151	2026-03-29 06:49:02.270151	\N	新/青砖奶茶	SP0000054			1	58.00	0.00	6977252570039	0	0	0	0	1	1	1	1	f	f
982			178	塑料袋	0	个	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:04.122927	2026-03-29 06:49:04.122927	\N	塑料手提袋	SP0000052			1	0.00	0.19	6900000526367	0	0	0	0	1	1	1	1	f	f
984			205	青砖奶茶	0	张	0		一张	0.00	0.00	0	0	0		1		2026-03-29 06:49:07.274393	2026-03-29 06:49:07.274393	\N	茶包/类腰封纸	SP0000050			1	0.00	0.18	6900000504012	0	0	0	0	1	1	1	1	f	f
986			189	半成品	0	袋	0		150克	0.00	0.00	0	0	0		1		2026-03-29 06:49:09.108042	2026-03-29 06:49:09.108042	\N	精品/奶豆腐块儿/原味	SP0000048			1	20.00	14.50	6900000481263	0	0	0	0	1	1	1	1	f	f
994			193	成品	0	盒	0		110克	0.00	0.00	0	0	0		1		2026-03-29 06:49:19.767881	2026-03-29 06:49:19.767881	\N	冻炒米成品盒	SP0000040			1	36.00	6.00	6900000408112	0	0	0	0	1	1	1	1	f	f
996			193	成品	0	盒	0		16次泡	0.00	0.00	0	0	0		1		2026-03-29 06:49:21.709118	2026-03-29 06:49:21.709118	\N	青砖奶茶成品	SP0000038			1	58.00	15.00	6900000389670	0	0	0	0	1	1	1	1	f	f
999			205	青砖奶茶	0	张	0		0	0.00	0.00	0	0	0		1		2026-03-29 06:49:24.473332	2026-03-29 06:49:24.473332	\N	茶专用/不干胶/标签	SP0000035			1	0.00	0.04	6900000358921	0	0	0	0	1	1	1	1	f	f
1002			214	设备	0	台	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:28.558493	2026-03-29 06:49:28.558493	\N	封口机/真空	SP0000032			1	0.00	3800.00	6900000324528	0	0	0	0	1	1	1	1	f	f
1004			204	其他成本	0	件	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:30.397892	2026-03-29 06:49:30.397892	\N	圆通速递快递费	SP0000030			1	0.00	4.00	6900000308856	0	0	0	0	1	1	1	1	f	f
1006			204	其他成本	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:32.29213	2026-03-29 06:49:32.29213	\N	顺丰快递费	SP0000028			1	0.00	0.00	6900000286232	0	0	0	0	1	1	1	1	f	f
1008			193	成品	0	袋	0		250克	0.00	0.00	0	0	0		1		2026-03-29 06:49:34.136449	2026-03-29 06:49:34.136449	\N	甜味奶条成品	SP0000026			1	52.00	10.61	6900000265125	0	0	0	0	1	1	1	1	f	f
1012			204	其他成本	0	个	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:37.853679	2026-03-29 06:49:37.853679	\N	北方人工费	SP0000022			1	0.00	1.30	6900000221261	0	0	0	0	1	1	1	1	f	f
1016			187	黄油	0	瓶	0		100ML	0.00	0.00	0	0	0		1		2026-03-29 06:49:41.599301	2026-03-29 06:49:41.599301	\N	专瓶/黄油	SP0000018			1	0.00	1.80	6900000186971	0	0	0	0	1	1	1	1	f	f
1017			178	塑料袋	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:42.517342	2026-03-29 06:49:42.517342	\N	手提袋	SP0000017			1	0.00	0.94	6900000178722	0	0	0	0	1	1	1	1	f	f
1019			212	冻炒米	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:44.564594	2026-03-29 06:49:44.564594	\N	标签/不干胶/冻炒米	SP0000015			1	0.00	0.07	6900000151480	0	0	0	0	1	1	1	1	f	f
1020			210	奶果子	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:45.516509	2026-03-29 06:49:45.516509	\N	标签/不干胶/奶果子	SP0000014			1	0.00	0.03	6900000148085	0	0	0	0	1	1	1	1	f	f
1022			207	传统奶豆腐	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:47.397246	2026-03-29 06:49:47.397246	\N	专袋/传统奶豆腐	SP0000012			1	0.00	0.55	6900000127767	0	0	0	0	1	1	1	1	f	f
1010			189	半成品	0	个	0		400/箱/0.423/球	0.00	0.00	0	0	0		1		2026-03-29 06:49:36.02884	2026-04-02 02:57:58.627711	\N	奶油球	SP0000024			1	0.00	0.45	6900000243728	0	0	0	0	1	1	1	1	t	f
990			210	奶果子	0	袋	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:14.199822	2026-04-02 02:58:12.765298	\N	奶果子/专用塑膜袋	SP0000044			1	0.00	0.10	6900000443474	0	0	0	0	1	1	1	1	t	f
988			193	成品	0	袋	0		150	0.00	0.00	0	0	0		1		2026-03-29 06:49:11.402339	2026-04-02 02:58:20.38729	\N	原味传统奶豆腐/成品袋装	SP0000046			1	34.00	12.78	6900000461987	0	0	0	0	1	1	1	1	t	f
974			203	组装好品	0	瓶	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:48:55.46244	2026-04-02 02:58:29.702359	\N	纯净黄油/瓶装好的	SP0000060			1	0.00	6.00	6900000604359	0	0	0	0	1	1	1	1	t	f
953			199	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-29 06:48:33.971244	2026-03-29 06:48:33.971244	\N	透专标签/奶酪/甜味	SP0000082			1	0.00	0.37	6900000828304	0	0	0	0	1	1	1	1	f	f
955			199	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-29 06:48:35.780754	2026-03-29 06:48:35.780754	\N	透专标签/乳清奶条/原味	SP0000080			1	0.00	0.05	6900000807613	0	0	0	0	1	1	1	1	f	f
958			201	亚克力	0	盒	0		乳清奶条盒	0.00	0.00	0	0	0		1		2026-03-29 06:48:39.011957	2026-03-29 06:48:39.011957	\N	小/长方/亚克力/乳清奶条盒	SP0000077			1	0.00	1.20	6900000778282	0	0	0	0	1	1	1	1	f	f
960			201	亚克力	0	盒	0		31g	0.00	0.00	0	0	0		1		2026-03-29 06:48:40.941275	2026-03-29 06:48:40.941275	\N	三角/奶皮千层盒	SP0000075			1	0.00	0.85	6900000754498	0	0	0	0	1	1	1	1	f	f
963			201	亚克力	0	盒	0		7.4X7.4X7.8 奶豆腐/冻炒米通用	0.00	0.00	0	0	0		1		2026-03-29 06:48:43.763191	2026-03-29 06:48:43.763191	\N	小/方形/亚克力盒/	SP0000071			1	2.00	0.80	6900000719676	0	0	0	0	1	1	1	1	f	f
965			200	给组装好产品	0	盒	0		140克	0.00	0.00	0	0	0		1		2026-03-29 06:48:45.594305	2026-03-29 06:48:45.594305	\N	半成品/透明/冻炒米	SP0000069			2	23.50	4.20	6900000699220	0	0	0	0	1	1	1	1	f	f
967			168	散货	0	桶	0		4斤装	0.00	0.00	0	0	0	4斤装/1元一斤	1		2026-03-29 06:48:48.573276	2026-03-29 06:48:48.573276	\N	查嘎/乳清	SP0000067			1	10.00	4.00	6900000679211	0	0	0	0	1	1	1	1	f	f
969			172	散装	0	张	0		120-150克	0.00	0.00	0	0	0		1		2026-03-29 06:48:50.432711	2026-03-29 06:48:50.432711	\N	小/奶皮	SP0000065			1	15.00	10.00	6900000651693	0	0	0	0	1	1	1	1	f	f
971			172	散装	0	斤	0		45散称/斤/9元/100克	0.00	0.00	0	0	0		1		2026-03-29 06:48:52.219121	2026-03-29 06:48:52.219121	\N	甜味/散称/奶豆腐块儿	SP0000063			1	70.00	45.00	6900000639276	0	0	0	0	1	1	1	1	f	f
973			189	半成品	0	袋	0		150克	0.00	0.00	0	0	0		1		2026-03-29 06:48:54.105148	2026-03-29 06:48:54.105148	\N	精品/奶豆腐块儿/甜味/	SP0000061			1	20.00	14.50	6900000617311	0	0	0	0	1	1	1	1	f	f
975			187	黄油	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:48:56.402437	2026-03-29 06:48:56.402437	\N	黄油脖签	SP0000059			1	0.00	0.08	6900000598069	0	0	0	0	1	1	1	1	f	f
976			193	成品	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:48:57.349972	2026-03-29 06:48:57.349972	\N	暂用/茶 新旧更替	SP0000058			1	58.00	0.00	6900000589769	0	0	0	0	1	1	1	1	f	f
977			204	其他成本	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:48:59.050296	2026-03-29 06:48:59.050296	\N	新茶包人工费	SP0000057			1	0.00	1.00	6900000571565	0	0	0	0	1	1	1	1	f	f
983			207	传统奶豆腐	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:06.374033	2026-03-29 06:49:06.374033	\N	甜味/标签/不干胶/传统奶豆腐	SP0000051			1	0.00	0.06	6900000517653	0	0	0	0	1	1	1	1	f	f
987			208	样品采购	0	斤	0		不定具体产品	0.00	0.00	0	0	0		1		2026-03-29 06:49:10.488839	2026-03-29 06:49:10.488839	\N	采购样品专用/乳制品	SP0000047			1	0.00	0.00	6900000479748	0	0	0	0	1	1	1	1	f	f
992			193	成品	0	盒	0		240克	0.00	0.00	0	0	0		1		2026-03-29 06:49:16.624293	2026-03-29 06:49:16.624293	\N	奶果子/盒装/成品	SP0000042			1	58.00	13.21	6900000427543	0	0	0	0	1	1	1	1	f	f
993			212	冻炒米	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:18.84322	2026-03-29 06:49:18.84322	\N	冻炒米专用/塑膜袋	SP0000041			1	0.00	0.10	6900000413063	0	0	0	0	1	1	1	1	f	f
998			205	青砖奶茶	0	张	0		0	0.00	0.00	0	0	0		1		2026-03-29 06:49:23.558588	2026-03-29 06:49:23.558588	\N	茶专用/硫酸纸	SP0000036			1	0.00	0.32	6900000362581	0	0	0	0	1	1	1	1	f	f
1001			214	设备	0	台	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:27.293725	2026-03-29 06:49:27.293725	\N	冷冻柜/冰箱	SP0000033			1	0.00	1609.48	6900000335117	0	0	0	0	1	1	1	1	f	f
1003			214	设备	0	台	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:29.482236	2026-03-29 06:49:29.482236	\N	热收缩膜机	SP0000031			1	0.00	1838.00	6900000316828	0	0	0	0	1	1	1	1	f	f
1005			204	其他成本	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:31.377292	2026-03-29 06:49:31.377292	\N	泰成物流费	SP0000029			1	0.00	0.00	6900000291007	0	0	0	0	1	1	1	1	f	f
1007			193	成品	0	袋	0		250克	0.00	0.00	0	0	0		1		2026-03-29 06:49:33.228395	2026-03-29 06:49:33.228395	\N	原味奶条成品	SP0000027			1	52.00	11.61	6900000277492	0	0	0	0	1	1	1	1	f	f
1009			205	青砖奶茶	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:35.084281	2026-03-29 06:49:35.084281	\N	专盒/青砖奶茶外盒	SP0000025			1	0.00	2.50	6900000256884	0	0	0	0	1	1	1	1	f	f
1013			189	半成品	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:38.797883	2026-03-29 06:49:38.797883	\N	冻炒米/给组装半成品/那牧尔	SP0000021			2	0.00	5.50	6900000218137	0	0	0	0	1	1	1	1	f	f
1011			189	半成品	0	小包	0		1件2000包/300元/1件	0.00	0.00	0	0	0	已加运费平均采购价	1		2026-03-29 06:49:36.942129	2026-04-02 02:57:56.066187	\N	茶包	SP0000023			1	0.00	0.18	6900000233034	0	0	0	0	1	1	1	1	t	f
1000			205	青砖奶茶	0	个	0		袋100个/平均价0.1599	0.00	0.00	0	0	0		1		2026-03-29 06:49:25.419757	2026-04-02 02:58:01.320645	\N	木勺	SP0000034			1	0.00	0.16	6900000349016	0	0	0	0	1	1	1	1	t	f
997			189	半成品	0	小包	0		2g	0.00	0.00	0	0	0		1		2026-03-29 06:49:22.630194	2026-04-02 02:58:03.495625	\N	茶专用/盐包	SP0000037			1	0.00	0.07	6900000375562	0	0	0	0	1	1	1	1	t	f
995			205	青砖奶茶	0	袋	0		0	0.00	0.00	0	0	0		1		2026-03-29 06:49:20.768185	2026-04-02 02:58:06.282359	\N	茶专用/热缩膜	SP0000039			1	0.00	0.10	6900000393419	0	0	0	0	1	1	1	1	t	f
991			189	半成品	0	块儿	0		平均一块儿	0.00	0.00	0	0	0		1		2026-03-29 06:49:15.192546	2026-04-02 02:58:09.554444	\N	奶果子/散装	SP0000043			1	2.50	0.80	6900000434411	0	0	0	0	1	1	1	1	t	f
989			193	成品	0	瓶	0		100克	0.00	0.00	0	0	0		1		2026-03-29 06:49:12.346781	2026-04-02 02:58:15.588928	\N	蒙古黄油/瓶装成品	SP0000045			1	39.00	8.05	6900000452315	0	0	0	0	1	1	1	1	t	f
985			193	成品	0	袋	0		150克	0.00	0.00	0	0	0		1		2026-03-29 06:49:08.209757	2026-04-02 02:58:22.649839	\N	甜味传统奶豆腐/袋装成品	SP0000049			1	34.00	12.78	6900000499096	0	0	0	0	1	1	1	1	t	f
981			172	散装	0	盒	0		斤/两盒	0.00	0.00	0	0	0		1		2026-03-29 06:49:03.200495	2026-04-02 02:58:25.429716	\N	烤奶皮	SP0000053			1	30.00	22.00	6900000535282	0	0	0	0	1	1	1	1	t	f
979			205	青砖奶茶	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:01.363799	2026-04-02 02:58:27.580916	\N	新茶包/纸	SP0000055			1	0.00	0.27	6900000553413	0	0	0	0	1	1	1	1	t	f
1018			178	塑料袋	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:43.444451	2026-03-29 06:49:43.444451	\N	礼盒/蓝界	SP0000016			1	8.00	4.55	6900000169010	0	0	0	0	1	1	1	1	f	f
1021			207	传统奶豆腐	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:46.451412	2026-03-29 06:49:46.451412	\N	原味/标签/不干胶/传统奶豆腐	SP0000013			1	0.00	0.06	6900000132020	0	0	0	0	1	1	1	1	f	f
1023			215	奶条	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:48.83623	2026-03-29 06:49:48.83623	\N	标签/不干胶/奶条/原味	SP0000011			1	0.00	0.05	6900000115061	0	0	0	0	1	1	1	1	f	f
1027			178	塑料袋	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:52.573581	2026-03-29 06:49:52.573581	\N	真空袋	SP0000007			1	0.00	0.17	6900000079283	0	0	0	0	1	1	1	1	f	f
1033			215	奶条	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:58.382336	2026-04-02 02:57:24.380046	\N	专袋/奶条	SP0000001			1	0.00	0.71	6900000015365	0	0	0	0	1	1	1	1	t	f
1031			215	奶条	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:56.37743	2026-04-02 02:57:35.417654	\N	专底盒/奶条	SP0000003			1	0.00	0.37	6900000032892	0	0	0	0	1	1	1	1	t	f
1029			210	奶果子	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:54.408934	2026-04-02 02:57:40.152552	\N	专内盒/奶果子	SP0000005			1	0.00	0.65	6900000053298	0	0	0	0	1	1	1	1	t	f
1025			210	奶果子	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:50.732689	2026-04-02 02:57:46.071502	\N	定制款/专内袋/扎那家奶果子	SP0000009			1	0.00	0.07	6900000097364	0	0	0	0	1	1	1	1	t	f
1024			215	奶条	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:49.772554	2026-03-29 06:49:49.772554	\N	标签/不干胶/奶条/甜味	SP0000010			1	0.00	0.05	6900000108033	0	0	0	0	1	1	1	1	f	f
1028			187	黄油	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:53.495723	2026-03-29 06:49:53.495723	\N	专标签/黄油	SP0000006			1	0.00	0.06	6900000068809	0	0	0	0	1	1	1	1	f	f
3080			0		0		0			0.00	0.00	0	0	0		1		2026-03-30 16:54:36.941869	2026-03-30 16:54:36.941869	2026-03-30 16:54:37.7036	_TEST_IMPORT_DELETE_ME				1	0.00	0.00		0	0	0	0	1	1	1	1	f	f
1032			212	冻炒米	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:57.401382	2026-04-02 02:57:31.714994	\N	专盒/冻炒米	SP0000002			1	0.00	0.87	6900000028430	0	0	0	0	1	1	1	1	t	f
1030			210	奶果子	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:55.371296	2026-04-02 02:57:37.976085	\N	专外盒/奶果子	SP0000004			1	0.00	0.65	6900000045203	0	0	0	0	1	1	1	1	t	f
1026			210	奶果子	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-29 06:49:51.651482	2026-04-02 02:57:42.427898	\N	专内袋/奶果子	SP0000008			1	0.00	0.08	6900000085792	0	0	0	0	1	1	1	1	t	f
1015			189	半成品	0	袋	0		250克/一袋	0.00	0.00	0	0	0		1		2026-03-29 06:49:40.677313	2026-04-02 02:57:49.245222	\N	散装/原味奶条	SP0000019			1	0.00	9.00	6915451232840	0	0	0	0	1	1	1	1	t	f
1014			189	半成品	0	袋	0		250克/一袋	0.00	0.00	0	0	0		1		2026-03-29 06:49:39.760183	2026-04-02 02:57:53.868066	\N	散装/甜味奶条	SP0000020			1	15.00	8.50	6962547070553	0	0	0	0	1	1	1	1	t	f
922			181	糖果sugar	0	斤	0		1斤散称	0.00	0.00	0	0	0		1		2026-03-29 06:48:03.552073	2026-04-02 02:58:36.521854	\N	酸奶炒米糖/散装	SP0000113			1	20.00	10.00	6900001139227	0	0	0	0	1	1	1	1	t	f
872			189	半成品	0	袋	0		140克	0.00	0.00	0	0	0		1		2026-03-29 06:47:10.015007	2026-04-02 02:58:47.171283	\N	半成品/黄金纬度牛肉干/那牧尔	SP0000163			2	88.00	41.44	6973457825186	0	0	0	0	1	1	1	1	t	f
3081			207		0	块	0		1	0.00	0.00	0	0	0		1		2026-04-02 05:08:11.653687	2026-04-02 05:08:11.653687	\N	奶豆腐块			实惠奶豆腐，科尔沁奶食品供货	1	25.00	0.00		0	0	0	0	1	1	1	1	f	f
\.


--
-- Data for Name: goods_brand; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods_brand (id, name, status, create_time) FROM stdin;
\.


--
-- Data for Name: goods_cate; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods_cate (id, name, parent_id, sort, status, create_time) FROM stdin;
167	广告物料	0	0	1	2026-03-29 06:45:49.536786
168	散货	0	0	1	2026-03-29 06:45:53.755009
169	散货	168	0	1	2026-03-29 06:45:54.188484
170	成品	169	0	1	2026-03-29 06:45:54.671183
171	酒	170	0	1	2026-03-29 06:46:06.346515
172	散装	168	0	1	2026-03-29 06:46:12.348459
173	品牌	168	0	1	2026-03-29 06:46:16.151502
174	透明	173	0	1	2026-03-29 06:46:16.633794
175	成品	174	0	1	2026-03-29 06:46:17.077612
176	通用礼盒	0	0	1	2026-03-29 06:46:26.217205
177	手提袋	176	0	1	2026-03-29 06:46:28.57814
178	塑料袋	177	0	1	2026-03-29 06:46:29.037589
179	茶类	170	0	1	2026-03-29 06:46:31.499258
180	成品	179	0	1	2026-03-29 06:46:31.978033
181	糖果sugar	170	0	1	2026-03-29 06:46:42.124939
182	专包	168	0	1	2026-03-29 06:46:44.418914
183	材	182	0	1	2026-03-29 06:46:44.895763
184	袋子	183	0	1	2026-03-29 06:46:45.338646
185	包材	0	0	1	2026-03-29 06:46:56.913169
186	专包材	185	0	1	2026-03-29 06:46:57.425495
187	黄油	186	0	1	2026-03-29 06:46:58.008847
189	半成品	188	0	1	2026-03-29 06:47:09.026076
190	高端品包材	188	0	1	2026-03-29 06:47:10.489275
191	专包	190	0	1	2026-03-29 06:47:10.975798
192	牛肉干	191	0	1	2026-03-29 06:47:11.414313
193	成品	188	0	1	2026-03-29 06:47:12.963785
194	客户	175	0	1	2026-03-29 06:47:14.375084
195	专属	194	0	1	2026-03-29 06:47:14.807194
196	定制类产品	195	0	1	2026-03-29 06:47:15.280012
197	那牧尔	170	0	1	2026-03-29 06:47:31.409256
198	供货品	197	0	1	2026-03-29 06:47:31.894537
199	标签纸	183	0	1	2026-03-29 06:47:39.545804
200	给组装好产品	168	0	1	2026-03-29 06:48:19.298514
201	亚克力	183	0	1	2026-03-29 06:48:37.175267
202	散小包装	168	0	1	2026-03-29 06:48:46.054218
203	组装好品	188	0	1	2026-03-29 06:48:54.545469
204	其他成本	0	0	1	2026-03-29 06:48:57.790078
205	青砖奶茶	186	0	1	2026-03-29 06:48:59.555321
206	专袋	185	0	1	2026-03-29 06:49:04.562385
207	传统奶豆腐	206	0	1	2026-03-29 06:49:05.03863
208	样品采购	0	0	1	2026-03-29 06:49:09.573978
209	专盒	185	0	1	2026-03-29 06:49:12.790309
210	奶果子	209	0	1	2026-03-29 06:49:13.284988
211	包材	185	0	1	2026-03-29 06:49:17.093791
212	冻炒米	211	0	1	2026-03-29 06:49:17.543121
213	机器	0	0	1	2026-03-29 06:49:25.88655
214	设备	213	0	1	2026-03-29 06:49:26.381084
215	奶条	211	0	1	2026-03-29 06:49:47.902666
188	牧区纯坊X游牧奇遇	0	1	1	2026-03-29 06:47:08.592627
\.


--
-- Data for Name: goods_spec; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods_spec (id, name, "values", status, create_time) FROM stdin;
\.


--
-- Data for Name: goods_unit; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods_unit (id, name, status, create_time) FROM stdin;
\.


--
-- Data for Name: goods_unit_convert; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods_unit_convert (id, goods_id, unit_name, ratio, create_time) FROM stdin;
1	1033	捆	50.0000	2026-04-02 02:57:23.007274
2	1033	张	1.0000	2026-04-02 02:57:23.014777
3	1032	捆	50.0000	2026-04-02 02:57:26.332156
4	1032	张	1.0000	2026-04-02 02:57:26.334359
5	1031	捆	50.0000	2026-04-02 02:57:34.445093
6	1031	张	1.0000	2026-04-02 02:57:34.447622
7	1030	捆	50.0000	2026-04-02 02:57:36.579382
8	1030	张	1.0000	2026-04-02 02:57:36.581267
9	1029	捆	40.0000	2026-04-02 02:57:39.117337
10	1029	张	1.0000	2026-04-02 02:57:39.119364
11	1026	捆	200.0000	2026-04-02 02:57:41.304221
12	1026	张	1.0000	2026-04-02 02:57:41.306799
13	1025	捆	200.0000	2026-04-02 02:57:45.079707
14	1025	张	1.0000	2026-04-02 02:57:45.081835
15	1015	斤	2.0000	2026-04-02 02:57:48.192674
16	1015	袋	1.0000	2026-04-02 02:57:48.194981
17	1014	斤	2.0000	2026-04-02 02:57:51.051975
18	1014	袋	1.0000	2026-04-02 02:57:51.05389
19	1011	件	2000.0000	2026-04-02 02:57:55.034758
20	1011	小包	1.0000	2026-04-02 02:57:55.03675
21	1010	件	400.0000	2026-04-02 02:57:57.260804
22	1010	个	1.0000	2026-04-02 02:57:57.26272
23	1000	捆	100.0000	2026-04-02 02:57:59.764198
24	1000	个	1.0000	2026-04-02 02:57:59.766232
25	997	件	1000.0000	2026-04-02 02:58:02.510474
26	997	小包	1.0000	2026-04-02 02:58:02.512739
27	995	捆	100.0000	2026-04-02 02:58:05.246556
28	995	袋	1.0000	2026-04-02 02:58:05.248898
29	991	斤	31.0000	2026-04-02 02:58:07.519446
30	991	块儿	1.0000	2026-04-02 02:58:07.522504
31	990	捆	100.0000	2026-04-02 02:58:10.753354
32	990	袋	1.0000	2026-04-02 02:58:10.757403
33	989	斤	5.0000	2026-04-02 02:58:14.582466
34	989	瓶	1.0000	2026-04-02 02:58:14.584355
35	988	斤	3.0000	2026-04-02 02:58:18.161341
36	988	袋	1.0000	2026-04-02 02:58:18.163183
37	985	斤	3.0000	2026-04-02 02:58:21.581665
38	985	袋	1.0000	2026-04-02 02:58:21.583684
39	981	斤	2.0000	2026-04-02 02:58:23.815495
40	981	盒	1.0000	2026-04-02 02:58:23.817847
41	979	件	16.0000	2026-04-02 02:58:26.577307
42	979	张	1.0000	2026-04-02 02:58:26.579331
43	974	斤	5.0000	2026-04-02 02:58:28.728815
44	974	瓶	1.0000	2026-04-02 02:58:28.731103
45	923	麻袋	10.0000	2026-04-02 02:58:33.330347
46	923	斤	1.0000	2026-04-02 02:58:33.332286
47	922	麻袋	5.0000	2026-04-02 02:58:35.540349
48	922	斤	1.0000	2026-04-02 02:58:35.542602
49	921	麻袋	5.0000	2026-04-02 02:58:37.680508
50	921	斤	1.0000	2026-04-02 02:58:37.682591
51	916	斤	2.0000	2026-04-02 02:58:39.824999
52	916	盒	1.0000	2026-04-02 02:58:39.826912
53	902	麻袋	5.0000	2026-04-02 02:58:42.570444
54	902	斤	1.0000	2026-04-02 02:58:42.572505
55	872	斤	4.0000	2026-04-02 02:58:46.169468
56	872	袋	1.0000	2026-04-02 02:58:46.171617
57	871	件	32.0000	2026-04-02 02:58:48.972166
58	871	个	1.0000	2026-04-02 02:58:48.975751
59	870	件	12.0000	2026-04-02 02:58:51.866343
60	870	个	1.0000	2026-04-02 02:58:51.868355
61	869	件	28.0000	2026-04-02 02:58:54.513024
62	869	袋	1.0000	2026-04-02 02:58:54.515088
63	868	件	20.0000	2026-04-02 02:58:57.466843
64	868	袋	1.0000	2026-04-02 02:58:57.469083
65	867	件	60.0000	2026-04-02 02:59:01.556829
66	867	盒	1.0000	2026-04-02 02:59:01.559101
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.jobs (id, name, dept_id, status, created_at) FROM stdin;
\.


--
-- Data for Name: operation_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.operation_logs (id, admin_id, admin_name, action, ip, created_at) FROM stdin;
\.


--
-- Data for Name: pay_receipt; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pay_receipt (id, receipt_no, order_sn, contact_type, contact_name, amount, pay_date, fund_id, fund_name, remark, status, created_at, deleted_at, category) FROM stdin;
50	FK202603299243		other	一个安全灯，两个灭火器	205.00	2026-02-10	5	道力干记录付款单	一个安全灯，两个灭火器	1	2026-03-29 15:37:29.949765	\N	
51	FK202603293286		other	包装支出	4300.00	2026-02-01	7	公司支出账户	乌海文旅集团包装印刷费用	1	2026-03-29 15:37:31.828773	\N	
52	FK202603296295		other	购物袋/小/中/大/奶皮真空袋/各100张	54.00	2026-02-01	7	公司支出账户	购物袋/小/中/大/奶皮真空袋/各100张	1	2026-03-29 15:37:32.734334	\N	
53	FK202603298127		other	民族印刷厂	16.00	2026-01-08	7	公司支出账户	乌海文旅集团集团打印	1	2026-03-29 15:37:33.677508	\N	
54	FK202603293993		other	路费/收费站	43.00	2026-01-08	7	公司支出账户	乌海文旅集团/合同文件/ 打样礼盒	1	2026-03-29 15:37:34.609582	\N	
55	FK202603294726		other	店面	360.00	2026-01-05	7	公司支出账户	店面	1	2026-03-29 15:37:35.616719	\N	
56	FK202603296408		other	劳务费	719.00	2026-01-05	7	公司支出账户	劳务费	1	2026-03-29 15:37:36.519705	\N	
57	FK202603295513		other	店面	405.00	2025-12-28	8	孟根	编织筐。10个250元\n地毯。155元	1	2026-03-29 15:37:38.346429	\N	
58	FK202603299673		other	店面	145.00	2025-12-28	8	孟根	地毯36➕麻绳20=56元\n试营业字打印4元\n发财树80元\n推拉贴 5元	1	2026-03-29 15:37:39.350547	\N	
59	FK202603294846		other	店面	3500.00	2025-12-28	8	孟根	店面	1	2026-03-29 15:37:40.345208	\N	
60	FK202603299527		other	那牧尔乳制品厂/纯净之源	20.00	2025-12-16	7	公司支出账户	拉货	1	2026-03-29 15:37:41.252526	\N	
61	FK202603295590		other	那牧尔乳制品厂/纯净之源	487.60	2025-12-05	7	公司支出账户	奶果子内袋包装费/42.92公斤/1公斤11.36元。	1	2026-03-29 15:37:42.148896	\N	
62	FK202603296675		other	店面	150.00	2025-12-04	7	公司支出账户	店面	1	2026-03-29 15:37:43.177797	\N	
63	FK202603295685		other	店面	600.00	2025-12-04	7	公司支出账户	店面	1	2026-03-29 15:37:44.150817	\N	
64	FK202603293583		other	拼多多/随机店采购	38.90	2025-12-04	7	公司支出账户	计算器	1	2026-03-29 15:37:45.062344	\N	
65	FK202603293606		other	店面	400.00	2025-12-04	7	公司支出账户	要了分断式的	1	2026-03-29 15:37:45.972017	\N	
66	FK202603294619		other	店面	180.00	2025-12-04	7	公司支出账户	三个货架+地板贴	1	2026-03-29 15:37:46.873213	\N	
67	FK202603294511		other	包装支出	400.00	2025-12-04	7	公司支出账户	打样费两次，定制打货5000以上会扣除。	1	2026-03-29 15:37:47.925845	\N	
68	FK202603293178		other	店面	31.30	2025-11-26	7	公司支出账户	店面	1	2026-03-29 15:37:48.900549	\N	
69	FK202603295676		other	店面	2800.00	2025-11-22	8	孟根	店面	1	2026-03-29 15:37:49.906692	\N	
70	FK202603293376		other	店面	113.00	2025-11-21	7	公司支出账户	店面	1	2026-03-29 15:37:50.855229	\N	
71	FK202603298255		other	店面	4000.00	2025-11-20	8	孟根	两个2米6	1	2026-03-29 15:37:51.782917	\N	
72	FK202603299758		other	店面	20.38	2025-11-20	7	公司支出账户	店面	1	2026-03-29 15:37:52.682326	\N	
73	FK202603292372		other	店面	1574.00	2025-11-17	8	孟根	店面	1	2026-03-29 15:37:53.622949	\N	
74	FK202603292865		other	店面	2800.45	2025-11-14	8	孟根	店面	1	2026-03-29 15:37:54.884444	\N	
75	FK202603295589		other	店面	65.20	2025-11-16	7	公司支出账户	店面	1	2026-03-29 15:37:55.770361	\N	
76	FK202603296838		other	店面	300.00	2025-11-16	7	公司支出账户	店面	1	2026-03-29 15:37:56.664712	\N	
77	FK202603293766		other	店面	1000.00	2025-11-16	7	公司支出账户	总额5000	1	2026-03-29 15:37:57.622223	\N	
78	FK202603297328		other	店面	1410.00	2025-11-16	7	公司支出账户	卫生间隔断60+安装三相电闸180+安装灯/插排/230/水龙头/90+地板贴安装/卫生850	1	2026-03-29 15:37:58.872661	\N	
79	FK202603292919		other	店面	399.00	2025-11-07	7	公司支出账户	已开票/三相电线	1	2026-03-29 15:37:59.793984	\N	
80	FK202603296019		other	店面	300.00	2025-11-16	7	公司支出账户	店面	1	2026-03-29 15:38:00.775247	\N	
81	FK202603292739		other	店面	1600.00	2025-11-16	7	公司支出账户	张静海/水暖/大白/隔断	1	2026-03-29 15:38:01.690294	\N	
82	FK202603299527		other	店面	5000.00	2025-11-11	8	孟根	张静海/水暖/大白/隔断/部分尾款	1	2026-03-29 15:38:02.57709	\N	
83	FK202603296344		other	其他支出	796.00	2025-11-01	9	乌日力格	其他支出	1	2026-03-29 15:38:04.41024	\N	
84	FK202603292934		other	店面	518.80	2025-11-01	8	孟根	店面	1	2026-03-29 15:38:05.340346	\N	
85	FK202603296825		other	店面	3400.00	2025-11-01	8	孟根	共计6400/已结清	1	2026-03-29 15:38:06.289758	\N	
86	FK202603297905		other	店面	700.00	2025-11-01	8	孟根	店面	1	2026-03-29 15:38:07.179161	\N	
87	FK202603291825		other	其他支出	1500.00	2025-11-01	9	乌日力格	共计2500， 还欠1000元	1	2026-03-29 15:38:08.105727	\N	
88	FK202603291967		other	店面	25.00	2025-10-28	9	乌日力格	钉子/发泡剂	1	2026-03-29 15:38:09.015514	\N	
89	FK202603295096		other	店面	5000.00	2025-10-26	9	乌日力格	总金额/预付款	1	2026-03-29 15:38:10.05528	\N	
90	FK202603292233		other	店面	350.00	2025-10-24	9	乌日力格	店面	1	2026-03-29 15:38:10.96623	\N	
91	FK202603291623		other	店面	540.00	2025-10-26	9	乌日力格	店面	1	2026-03-29 15:38:11.858102	\N	
92	FK202603294894		other	其他支出	800.00	2025-10-23	10	乌日力格/额外支出	其他支出	1	2026-03-29 15:38:14.074908	\N	
93	FK202603292505		other	其他支出	660.00	2025-10-26	10	乌日力格/额外支出	其他支出	1	2026-03-29 15:38:14.980808	\N	
94	FK202603294981		other	其他支出	10000.00	2025-10-26	10	乌日力格/额外支出	其他支出	1	2026-03-29 15:38:15.91545	\N	
95	FK202603294962		other	店面	286.00	2025-10-14	8	孟根	店面	1	2026-03-29 15:38:16.81842	\N	
96	FK202603295262		other	店面	3000.00	2025-10-13	8	孟根	店面	1	2026-03-29 15:38:17.725993	\N	
97	FK202603295739		other	劳务费	400.00	2025-10-12	9	乌日力格	仓库货品点数	1	2026-03-29 15:38:18.608155	\N	
98	FK202603298495		other	其他支出	18000.00	2025-10-09	8	孟根		1	2026-03-29 15:38:19.526667	\N	
99	FK202604018180	CG202603318815	supplier	银河包装	200.93	2025-09-30	17	银河包装	采购单CG202603318815审核自动生成	1	2026-04-01 01:38:12.893047	2026-04-03 07:19:16.654718	
100	FK202604015785	CG202603313025	supplier	盛大印刷	27.84	2025-09-30	18	盛大印刷	采购单CG202603313025审核自动生成	1	2026-04-01 01:38:50.706638	2026-04-03 07:19:18.004867	
101	FK202604011140	CG202603319057	supplier	银河包装	66.60	2025-09-30	17	银河包装	采购单CG202603319057审核自动生成	1	2026-04-01 01:38:52.913764	2026-04-03 07:19:19.386888	
102	FK202604013099	CG202603312326	supplier	银河包装	9.10	2025-09-30	17	银河包装	采购单CG202603312326审核自动生成	1	2026-04-01 01:38:57.015091	2026-04-03 07:19:20.73531	
103	FK202604018250	CG202603314925	supplier	盛大印刷	0.96	2025-09-30	18	盛大印刷	采购单CG202603314925审核自动生成	1	2026-04-01 01:38:59.508483	2026-04-03 07:19:22.113541	
104	FK202604011382	CG202603314472	supplier	淘宝紫辰包装	10.20	2025-09-30	19	淘宝紫辰包装	采购单CG202603314472审核自动生成	1	2026-04-01 01:39:02.327739	2026-04-03 07:19:23.489413	
105	FK202604015811	CG202603311551	supplier	银河包装	206.16	2025-09-30	17	银河包装	采购单CG202603311551审核自动生成	1	2026-04-01 01:39:06.244886	2026-04-03 07:19:24.911268	
107	FK202604013243	CG202603312835	supplier	盛大印刷	5.20	2025-09-30	18	盛大印刷	采购单CG202603312835审核自动生成	1	2026-04-01 01:39:13.134032	2026-04-03 07:19:27.783098	
108	FK202604018847	CG202603317171	supplier	淘宝紫辰包装	49.50	2025-09-30	19	淘宝紫辰包装	采购单CG202603317171审核自动生成	1	2026-04-01 01:39:16.528492	2026-04-03 07:19:29.211545	
109	FK202604013111	CG202603319135	supplier	盛大印刷	1.74	2025-09-30	18	盛大印刷	采购单CG202603319135审核自动生成	1	2026-04-01 01:39:18.805024	2026-04-03 07:19:30.603405	
110	FK202604017364	CG202603315123	supplier	盛大印刷	0.39	2025-09-30	18	盛大印刷	采购单CG202603315123审核自动生成	1	2026-04-01 01:39:22.096162	2026-04-03 07:19:31.962418	
111	FK202604015079	CG202603316376	supplier	盛大印刷	1469.00	2025-09-30	18	盛大印刷	采购单CG202603316376审核自动生成	1	2026-04-01 01:39:25.256777	2026-04-03 07:19:33.387331	
106	FK202604013579	CG202603313713	supplier	沈阳东源包材厂	2381.12	2025-09-30	20	沈阳东源包材厂	采购单CG202603313713审核自动生成	1	2026-04-01 01:39:09.313881	2026-04-01 01:39:29.0358	
153	FK202604018256	CG202603319137	supplier	淘宝/杂	925.00	2025-12-01	38	淘宝/杂	采购单CG202603319137审核自动生成	1	2026-04-01 01:41:16.468216	2026-04-03 07:18:14.41419	
152	FK202604014306	CG202603318843	supplier	翁牛特旗奶果子	2146.00	2025-11-30	26	翁牛特旗奶果子	采购单CG202603318843审核自动生成	1	2026-04-01 01:41:14.390363	2026-04-03 07:18:22.760887	
146	FK202604019236	CG202603317098	supplier	拼多多/木勺	159.90	2025-11-16	24	拼多多/木勺	采购单CG202603317098审核自动生成	1	2026-04-01 01:40:55.650516	2026-04-03 07:18:26.989771	
147	FK202604016107	CG202603318383	supplier	拼多多/热缩膜	245.49	2025-11-16	25	拼多多/热缩膜	采购单CG202603318383审核自动生成	1	2026-04-01 01:40:58.367347	2026-04-03 07:18:28.497809	
148	FK202604017052	CG202603312758	supplier	拼多多/随机店采购	38.00	2025-11-16	36	拼多多/随机店采购	采购单CG202603312758审核自动生成	1	2026-04-01 01:41:04.453555	2026-04-03 07:18:30.043011	
149	FK202604011960	CG202603315962	supplier	拼多多/随机店采购	2800.00	2025-11-16	36	拼多多/随机店采购	采购单CG202603315962审核自动生成	1	2026-04-01 01:41:07.558097	2026-04-03 07:18:31.507104	
150	FK202604016657	CG202603318653	supplier	盛大印刷	594.69	2025-11-16	18	盛大印刷	采购单CG202603318653审核自动生成	1	2026-04-01 01:41:10.173399	2026-04-03 07:18:32.943452	
151	FK202604019307	CG202603316610	supplier	民族印刷厂	96.00	2025-11-16	37	民族印刷厂	采购单CG202603316610审核自动生成	1	2026-04-01 01:41:12.272136	2026-04-03 07:18:34.31649	
144	FK202604011832	CG202603313230	supplier	广州维记	1817.00	2025-11-07	28	广州维记	采购单CG202603313230审核自动生成	1	2026-04-01 01:40:50.464208	2026-04-03 07:18:38.620609	
141	FK202604014150	CG202603319388	supplier	山东锦食食品	550.00	2025-11-01	23	山东锦食食品	采购单CG202603319388审核自动生成	1	2026-04-01 01:40:43.84265	2026-04-03 07:18:40.002558	
142	FK202604014436	CG202603313284	supplier	阿旗北方	46.80	2025-11-01	35	阿旗北方	采购单CG202603313284审核自动生成	1	2026-04-01 01:40:45.904882	2026-04-03 07:18:41.470368	
143	FK202604017261	CG202603313108	supplier	山东锦食食品	242.08	2025-11-01	23	山东锦食食品	采购单CG202603313108审核自动生成	1	2026-04-01 01:40:47.962681	2026-04-03 07:18:43.292892	
140	FK202604016241	CG202603316946	supplier	阿旗北方	16.50	2025-10-31	35	阿旗北方	采购单CG202603316946审核自动生成	1	2026-04-01 01:40:41.690931	2026-04-03 07:18:44.672007	
138	FK202604018495	CG202603315309	supplier	广州维记	1820.00	2025-10-26	28	广州维记	采购单CG202603315309审核自动生成	1	2026-04-01 01:40:36.758715	2026-04-03 07:18:46.060243	
139	FK202604011913	CG202603317037	supplier	锡盟艾润萨利SC	470.00	2025-10-26	34	锡盟艾润萨利SC	采购单CG202603317037审核自动生成	1	2026-04-01 01:40:39.439772	2026-04-03 07:18:47.575431	
137	FK202604016318	CG202603316258	supplier	淘宝欧信	1700.00	2025-10-22	33	淘宝欧信	采购单CG202603316258审核自动生成	1	2026-04-01 01:40:34.536977	2026-04-03 07:18:49.107985	
135	FK202604016325	CG202603311175	supplier	恩赫奶制品厂	284.40	2025-10-20	29	恩赫奶制品厂	采购单CG202603311175审核自动生成	1	2026-04-01 01:40:28.771078	2026-04-03 07:18:50.503666	
136	FK202604014635	CG202603318976	supplier	恩赫奶制品厂	82.80	2025-10-20	29	恩赫奶制品厂	采购单CG202603318976审核自动生成	1	2026-04-01 01:40:32.327963	2026-04-03 07:18:51.911061	
133	FK202604017117	CG202603315878	supplier	巴音珠萨朗	422.56	2025-10-12	31	巴音珠萨朗	采购单CG202603315878审核自动生成	1	2026-04-01 01:40:24.014476	2026-04-03 07:18:54.688686	
134	FK202604011589	CG202603314185	supplier	那牧尔乳制品厂/纯净之源	165.00	2025-10-12	32	那牧尔乳制品厂/纯净之源	采购单CG202603314185审核自动生成	1	2026-04-01 01:40:26.127408	2026-04-03 07:18:56.066786	
132	FK202604014808	CG202603313258	supplier	优如包装	7500.01	2025-10-11	30	优如包装	采购单CG202603313258审核自动生成	1	2026-04-01 01:40:21.276956	2026-04-03 07:18:57.458423	
131	FK202604016517	CG202603313299	supplier	恩赫奶制品厂	270.00	2025-10-10	29	恩赫奶制品厂	采购单CG202603313299审核自动生成	1	2026-04-01 01:40:18.1797	2026-04-03 07:18:58.915023	
130	FK202604013994	CG202603315174	supplier	广州维记	1455.00	2025-10-09	28	广州维记	采购单CG202603315174审核自动生成	1	2026-04-01 01:40:15.336029	2026-04-03 07:19:00.304005	
129	FK202604018125	CG202603319414	supplier	永巨茶业	2825.04	2025-10-06	27	永巨茶业	采购单CG202603319414审核自动生成	1	2026-04-01 01:40:13.193463	2026-04-03 07:19:01.718664	
120	FK202604012669	CG202603317526	supplier	山东锦食食品	151.10	2025-10-01	23	山东锦食食品	采购单CG202603317526审核自动生成	1	2026-04-01 01:39:48.768357	2026-04-03 07:19:03.392451	
121	FK202604016749	CG202603311612	supplier	拼多多/木勺	63.96	2025-10-01	24	拼多多/木勺	采购单CG202603311612审核自动生成	1	2026-04-01 01:39:52.128942	2026-04-03 07:19:05.219475	
122	FK202604011719	CG202603314707	supplier	盛大印刷	360.00	2025-10-01	18	盛大印刷	采购单CG202603314707审核自动生成	1	2026-04-01 01:39:54.175968	2026-04-03 07:19:06.725836	
123	FK202604016851	CG202603319038	supplier	拼多多/热缩膜	100.00	2025-10-01	25	拼多多/热缩膜	采购单CG202603319038审核自动生成	1	2026-04-01 01:39:56.255488	2026-04-03 07:19:08.201024	
124	FK202604016444	CG202603318635	supplier	银河包装	400.00	2025-10-01	17	银河包装	采购单CG202603318635审核自动生成	1	2026-04-01 01:39:59.411552	2026-04-03 07:19:09.599567	
125	FK202604015306	CG202603315898	supplier	拼多多/热缩膜	50.00	2025-10-01	25	拼多多/热缩膜	采购单CG202603315898审核自动生成	1	2026-04-01 01:40:03.360724	2026-04-03 07:19:10.982432	
126	FK202604016097	CG202603316864	supplier	翁牛特旗奶果子	456.00	2025-10-01	26	翁牛特旗奶果子	采购单CG202603316864审核自动生成	1	2026-04-01 01:40:05.362188	2026-04-03 07:19:12.421716	
127	FK202604014237	CG202603318624	supplier	拼多多/热缩膜	100.00	2025-10-01	25	拼多多/热缩膜	采购单CG202603318624审核自动生成	1	2026-04-01 01:40:08.007076	2026-04-03 07:19:13.887462	
128	FK202604017123	CG202603316040	supplier	翁牛特旗奶果子	360.00	2025-10-01	26	翁牛特旗奶果子	采购单CG202603316040审核自动生成	1	2026-04-01 01:40:10.089919	2026-04-03 07:19:15.263438	
113	FK202604018373	CG202603313713	supplier	银河包装	6580.05	2025-09-30	17	银河包装	采购单CG202603313713审核自动生成	1	2026-04-01 01:39:30.061788	2026-04-03 07:19:26.397598	
114	FK202604011522	CG202603318956	supplier	银河包装	5751.26	2025-09-30	17	银河包装	采购单CG202603318956审核自动生成	1	2026-04-01 01:39:32.652907	2026-04-03 07:19:37.79197	
115	FK202604018781	CG202603317717	supplier	盛大印刷	66.66	2025-09-30	18	盛大印刷	采购单CG202603317717审核自动生成	1	2026-04-01 01:39:35.941341	2026-04-03 07:19:39.279109	
116	FK202604017246	CG202603317878	supplier	淘宝紫辰包装	56.10	2025-09-30	19	淘宝紫辰包装	采购单CG202603317878审核自动生成	1	2026-04-01 01:39:38.187143	2026-04-03 07:19:40.661807	
117	FK202604016322	CG202603312052	supplier	淘宝紫辰包装	3.40	2025-09-30	19	淘宝紫辰包装	采购单CG202603312052审核自动生成	1	2026-04-01 01:39:40.908867	2026-04-03 07:19:42.513085	
118	FK202604012933	CG202603313843	supplier	淘宝/江苏永发玻璃制品厂	89.10	2025-09-30	22	淘宝/江苏永发玻璃制品厂	采购单CG202603313843审核自动生成	1	2026-04-01 01:39:42.982645	2026-04-03 07:19:43.959866	
119	FK202604018921	CG202603312503	supplier	盛大印刷	970.45	2025-09-30	18	盛大印刷	采购单CG202603312503审核自动生成	1	2026-04-01 01:39:45.01742	2026-04-03 07:19:45.400299	
197	FK202604019062	CG202603319789	supplier	巴音珠萨朗	310.20	2025-12-28	31	巴音珠萨朗	采购单CG202603319789审核自动生成	1	2026-04-01 01:43:12.17361	2026-04-03 07:16:13.985995	
190	FK202604011395	CG202603318798	supplier	科尔沁奶食品	140.00	2025-12-25	40	科尔沁奶食品	采购单CG202603318798审核自动生成	1	2026-04-01 01:42:54.876223	2026-04-03 07:16:17.273886	
191	FK202604018174	CG202603313911	supplier	阿润查干	182.00	2025-12-25	44	阿润查干	采购单CG202603313911审核自动生成	1	2026-04-01 01:42:57.009303	2026-04-03 07:16:18.824076	
192	FK202604013249	CG202603315570	supplier	纯净奶食品	2310.00	2025-12-25	39	纯净奶食品	采购单CG202603315570审核自动生成	1	2026-04-01 01:42:59.16655	2026-04-03 07:16:20.263095	
193	FK202604011462	CG202603318561	supplier	盛大印刷	47.80	2025-12-25	18	盛大印刷	采购单CG202603318561审核自动生成	1	2026-04-01 01:43:01.29454	2026-04-03 07:16:21.642641	
194	FK202604019416	CG202603311750	supplier	盛大印刷	33.50	2025-12-25	18	盛大印刷	采购单CG202603311750审核自动生成	1	2026-04-01 01:43:04.008618	2026-04-03 07:16:23.01622	
195	FK202604018267	CG202603316305	supplier	盛大印刷	43.20	2025-12-25	18	盛大印刷	采购单CG202603316305审核自动生成	1	2026-04-01 01:43:06.20373	2026-04-03 07:16:24.402341	
189	FK202604012522	CG202603319237	supplier	科尔沁奶食品	150.00	2025-12-24	40	科尔沁奶食品	采购单CG202603319237审核自动生成	1	2026-04-01 01:42:52.814758	2026-04-03 07:16:32.027608	
188	FK202604016991	CG202603319917	supplier	纯净奶食品	325.00	2025-12-21	39	纯净奶食品	采购单CG202603319917审核自动生成	1	2026-04-01 01:42:50.677649	2026-04-03 07:16:34.977931	
187	FK202604015923	CG202603315281	supplier	奥都奶食品	352.00	2025-12-19	43	奥都奶食品	采购单CG202603315281审核自动生成	1	2026-04-01 01:42:47.829625	2026-04-03 07:16:38.193774	
184	FK202604016923	CG202603316981	supplier	杂/采购商	144.00	2025-12-17	42	杂/采购商	采购单CG202603316981审核自动生成	1	2026-04-01 01:42:41.557755	2026-04-03 07:16:41.110618	
185	FK202604012626	CG202603319402	supplier	纯净奶食品	971.50	2025-12-17	39	纯净奶食品	采购单CG202603319402审核自动生成	1	2026-04-01 01:42:43.610873	2026-04-03 07:16:42.5846	
186	FK202604015250	CG202603312070	supplier	科尔沁奶食品	555.00	2025-12-17	40	科尔沁奶食品	采购单CG202603312070审核自动生成	1	2026-04-01 01:42:45.651256	2026-04-03 07:16:46.269405	
182	FK202604017883	CG202603314778	supplier	巴音珠萨朗	184.00	2025-12-16	31	巴音珠萨朗	采购单CG202603314778审核自动生成	1	2026-04-01 01:42:36.288167	2026-04-03 07:16:52.74749	
183	FK202604017363	CG202603312913	supplier	恩赫奶制品厂	216.00	2025-12-16	29	恩赫奶制品厂	采购单CG202603312913审核自动生成	1	2026-04-01 01:42:38.373525	2026-04-03 07:16:54.346084	
180	FK202604011200	CG202603318036	supplier	科尔沁奶食品	235.00	2025-12-14	40	科尔沁奶食品	采购单CG202603318036审核自动生成	1	2026-04-01 01:42:30.545034	2026-04-03 07:16:58.914365	
179	FK202604018898	CG202603317045	supplier	奥都奶食品	128.00	2025-12-13	43	奥都奶食品	采购单CG202603317045审核自动生成	1	2026-04-01 01:42:28.230427	2026-04-03 07:17:05.121889	
177	FK202604018982	CG202603315371	supplier	纯净奶食品	272.00	2025-12-12	39	纯净奶食品	采购单CG202603315371审核自动生成	1	2026-04-01 01:42:24.007646	2026-04-03 07:17:08.356939	
178	FK202604017371	CG202603316227	supplier	那牧尔乳制品厂/纯净之源	550.00	2025-12-12	32	那牧尔乳制品厂/纯净之源	采购单CG202603316227审核自动生成	1	2026-04-01 01:42:26.082986	2026-04-03 07:17:09.900895	
171	FK202604019173	CG202603319340	supplier	科尔沁奶食品	526.00	2025-12-10	40	科尔沁奶食品	采购单CG202603319340审核自动生成	1	2026-04-01 01:42:05.954276	2026-04-03 07:17:14.485616	
172	FK202604019180	CG202603319006	supplier	恩赫奶制品厂	554.40	2025-12-10	29	恩赫奶制品厂	采购单CG202603319006审核自动生成	1	2026-04-01 01:42:08.172811	2026-04-03 07:17:16.004413	
173	FK202604014518	CG202603316651	supplier	那牧尔乳制品厂/纯净之源	550.00	2025-12-10	32	那牧尔乳制品厂/纯净之源	采购单CG202603316651审核自动生成	1	2026-04-01 01:42:13.66642	2026-04-03 07:17:17.49641	
174	FK202604013723	CG202603319218	supplier	盛大印刷	963.00	2025-12-10	18	盛大印刷	采购单CG202603319218审核自动生成	1	2026-04-01 01:42:16.635108	2026-04-03 07:17:19.011959	
175	FK202604018696	CG202603313799	supplier	广州维记	3380.00	2025-12-10	28	广州维记	采购单CG202603313799审核自动生成	1	2026-04-01 01:42:19.555994	2026-04-03 07:17:20.533593	
176	FK202604015823	CG202603318375	supplier	杂/采购商	21.00	2025-12-10	42	杂/采购商	采购单CG202603318375审核自动生成	1	2026-04-01 01:42:21.705565	2026-04-03 07:17:21.963676	
168	FK202604018602	CG202603316236	supplier	科尔沁奶食品	48.00	2025-12-09	40	科尔沁奶食品	采购单CG202603316236审核自动生成	1	2026-04-01 01:41:59.393029	2026-04-03 07:17:32.178304	
169	FK202604017222	CG202603316781	supplier	科尔沁奶食品	25.00	2025-12-09	40	科尔沁奶食品	采购单CG202603316781审核自动生成	1	2026-04-01 01:42:01.523198	2026-04-03 07:17:33.63455	
170	FK202604016141	CG202603317747	supplier	科尔沁奶食品	751.00	2025-12-09	40	科尔沁奶食品	采购单CG202603317747审核自动生成	1	2026-04-01 01:42:03.898543	2026-04-03 07:17:35.235499	
166	FK202604015143	CG202603313199	supplier	奥都奶食品	240.00	2025-12-07	43	奥都奶食品	采购单CG202603313199审核自动生成	1	2026-04-01 01:41:54.348768	2026-04-03 07:17:41.283428	
167	FK202604013094	CG202603319564	supplier	优如包装	4400.01	2025-12-07	30	优如包装	采购单CG202603319564审核自动生成	1	2026-04-01 01:41:57.235093	2026-04-03 07:17:42.674919	
161	FK202604011706	CG202603316877	supplier	拼多多/随机店采购	124.62	2025-12-05	36	拼多多/随机店采购	采购单CG202603316877审核自动生成	1	2026-04-01 01:41:38.386878	2026-04-03 07:17:45.546872	
162	FK202604014459	CG202603314856	supplier	那牧尔乳制品厂/纯净之源	220.00	2025-12-05	32	那牧尔乳制品厂/纯净之源	采购单CG202603314856审核自动生成	1	2026-04-01 01:41:41.026047	2026-04-03 07:17:46.949182	
163	FK202604016827	CG202603317215	supplier	科尔沁奶食品	166.00	2025-12-05	40	科尔沁奶食品	采购单CG202603317215审核自动生成	1	2026-04-01 01:41:45.288989	2026-04-03 07:17:48.391457	
164	FK202604018384	CG202603319826	supplier	杂/采购商	107.00	2025-12-05	42	杂/采购商	采购单CG202603319826审核自动生成	1	2026-04-01 01:41:48.83886	2026-04-03 07:17:49.783647	
165	FK202604018763	CG202603318627	supplier	纯净奶食品	2805.00	2025-12-05	39	纯净奶食品	采购单CG202603318627审核自动生成	1	2026-04-01 01:41:51.072492	2026-04-03 07:17:51.218347	
157	FK202604017722	CG202603315629	supplier	科尔沁奶食品	154.00	2025-12-04	40	科尔沁奶食品	采购单CG202603315629审核自动生成	1	2026-04-01 01:41:26.840692	2026-04-03 07:17:59.921538	
158	FK202604012895	CG202603318249	supplier	纯净奶食品	772.00	2025-12-04	39	纯净奶食品	采购单CG202603318249审核自动生成	1	2026-04-01 01:41:29.522396	2026-04-03 07:18:01.375517	
159	FK202604017309	CG202603319829	supplier	浙江金矿包装	2199.50	2025-12-04	41	浙江金矿包装	采购单CG202603319829审核自动生成	1	2026-04-01 01:41:32.277023	2026-04-03 07:18:02.811214	
160	FK202604018129	CG202603314585	supplier	盛大印刷	743.93	2025-12-04	18	盛大印刷	采购单CG202603314585审核自动生成	1	2026-04-01 01:41:35.007562	2026-04-03 07:18:04.244688	
156	FK202604016700	CG202603311756	supplier	纯净奶食品	2359.60	2025-12-03	39	纯净奶食品	采购单CG202603311756审核自动生成	1	2026-04-01 01:41:24.199965	2026-04-03 07:18:11.509509	
155	FK202604014767	CG202603318017	supplier	淘宝紫辰包装	70.40	2025-12-01	19	淘宝紫辰包装	采购单CG202603318017审核自动生成	1	2026-04-01 01:41:20.969887	2026-04-03 07:18:17.197988	
238	FK202604019797	CG202603315671	supplier	科尔沁奶食品	95.00	2026-02-09	40	科尔沁奶食品	采购单CG202603315671审核自动生成	1	2026-04-01 01:44:54.821814	2026-04-03 07:15:15.569715	
239	FK202604015419	CG202603319839	supplier	科尔沁奶食品	158.00	2026-02-09	40	科尔沁奶食品	采购单CG202603319839审核自动生成	1	2026-04-01 01:44:57.569663	2026-04-03 07:15:16.906497	
237	FK202604016038	CG202603319631	supplier	小米厂家阿旗	573.00	2026-02-08	54	小米厂家阿旗	采购单CG202603319631审核自动生成	1	2026-04-01 01:44:51.799054	2026-04-03 07:15:18.261093	
235	FK202604012938	CG202603312071	supplier	兴安盟杭盖奶制品厂	380.00	2026-02-04	48	兴安盟杭盖奶制品厂	采购单CG202603312071审核自动生成	1	2026-04-01 01:44:47.285814	2026-04-03 07:15:19.59042	
236	FK202604015192	CG202603317293	supplier	科尔沁奶食品	50.00	2026-02-04	40	科尔沁奶食品	采购单CG202603317293审核自动生成	1	2026-04-01 01:44:49.345322	2026-04-03 07:15:20.905987	
232	FK202604013766	CG202603315234	supplier	科尔沁奶食品	1163.00	2026-02-01	40	科尔沁奶食品	采购单CG202603315234审核自动生成	1	2026-04-01 01:44:39.423911	2026-04-03 07:15:22.289994	
233	FK202604018130	CG202603317843	supplier	雷记炒货	100.00	2026-02-01	46	雷记炒货	采购单CG202603317843审核自动生成	1	2026-04-01 01:44:41.779744	2026-04-03 07:15:23.615326	
234	FK202604014630	CG202603314313	supplier	阿润查干	200.00	2026-02-01	44	阿润查干	采购单CG202603314313审核自动生成	1	2026-04-01 01:44:44.644908	2026-04-03 07:15:25.08079	
228	FK202604017460	CG202603312948	supplier	科尔沁奶食品	140.00	2026-01-27	40	科尔沁奶食品	采购单CG202603312948审核自动生成	1	2026-04-01 01:44:29.404755	2026-04-03 07:15:26.416967	
229	FK202604011694	CG202603314311	supplier	额吉伊德	161.00	2026-01-27	51	额吉伊德	采购单CG202603314311审核自动生成	1	2026-04-01 01:44:31.470749	2026-04-03 07:15:27.842345	
230	FK202604012704	CG202603312096	supplier	奥特尔奶食品店	526.00	2026-01-27	52	奥特尔奶食品店	采购单CG202603312096审核自动生成	1	2026-04-01 01:44:33.606618	2026-04-03 07:15:29.236294	
231	FK202604016749	CG202603317619	supplier	沈阳包装	2785.97	2026-01-27	53	沈阳包装	采购单CG202603317619审核自动生成	1	2026-04-01 01:44:35.628175	2026-04-03 07:15:30.581958	
227	FK202604016116	CG202603319664	supplier	科尔沁奶食品	400.00	2026-01-24	40	科尔沁奶食品	采购单CG202603319664审核自动生成	1	2026-04-01 01:44:27.321937	2026-04-03 07:15:31.947779	
221	FK202604016206	CG202603318926	supplier	科尔沁奶食品	80.00	2026-01-20	40	科尔沁奶食品	采购单CG202603318926审核自动生成	1	2026-04-01 01:44:11.43905	2026-04-03 07:15:33.556766	
222	FK202604013982	CG202603312795	supplier	扎旗吉十奶制品	90.00	2026-01-20	49	扎旗吉十奶制品	采购单CG202603312795审核自动生成	1	2026-04-01 01:44:13.533008	2026-04-03 07:15:34.900742	
223	FK202604019969	CG202603319171	supplier	阿齐图/巴林右旗	1470.00	2026-01-20	50	阿齐图/巴林右旗	采购单CG202603319171审核自动生成	1	2026-04-01 01:44:15.67895	2026-04-03 07:15:36.289962	
224	FK202604011889	CG202603313509	supplier	糖炮	140.00	2026-01-20	47	糖炮	采购单CG202603313509审核自动生成	1	2026-04-01 01:44:18.069209	2026-04-03 07:15:37.667009	
225	FK202604019990	CG202603315006	supplier	杂/采购商	49.36	2026-01-20	42	杂/采购商	采购单CG202603315006审核自动生成	1	2026-04-01 01:44:22.175997	2026-04-03 07:15:39.043958	
226	FK202604013286	CG202603311425	supplier	拼多多/热缩膜	140.00	2026-01-20	25	拼多多/热缩膜	采购单CG202603311425审核自动生成	1	2026-04-01 01:44:24.242406	2026-04-03 07:15:40.428344	
219	FK202604011585	CG202603318254	supplier	科尔沁奶食品	147.00	2026-01-19	40	科尔沁奶食品	采购单CG202603318254审核自动生成	1	2026-04-01 01:44:06.978223	2026-04-03 07:15:41.778045	
220	FK202604016875	CG202603311119	supplier	那牧尔乳制品厂/纯净之源	6364.00	2026-01-19	32	那牧尔乳制品厂/纯净之源	采购单CG202603311119审核自动生成	1	2026-04-01 01:44:09.401491	2026-04-03 07:15:43.098645	
217	FK202604013213	CG202603314014	supplier	兴安盟杭盖奶制品厂	190.00	2026-01-17	48	兴安盟杭盖奶制品厂	采购单CG202603314014审核自动生成	1	2026-04-01 01:44:02.273945	2026-04-03 07:15:44.473876	
218	FK202604016904	CG202603317632	supplier	科尔沁奶食品	378.00	2026-01-17	40	科尔沁奶食品	采购单CG202603317632审核自动生成	1	2026-04-01 01:44:04.867441	2026-04-03 07:15:45.902781	
214	FK202604015180	CG202603317919	supplier	阿润查干	680.00	2026-01-16	44	阿润查干	采购单CG202603317919审核自动生成	1	2026-04-01 01:43:53.518477	2026-04-03 07:15:47.265393	
215	FK202604013966	CG202603317814	supplier	糖炮	240.00	2026-01-16	47	糖炮	采购单CG202603317814审核自动生成	1	2026-04-01 01:43:55.53165	2026-04-03 07:15:48.630679	
216	FK202604018882	CG202603311710	supplier	永巨茶业	3310.00	2026-01-16	27	永巨茶业	采购单CG202603311710审核自动生成	1	2026-04-01 01:43:57.742593	2026-04-03 07:15:49.988077	
210	FK202604018813	CG202603315468	supplier	科尔沁奶食品	50.00	2026-01-11	40	科尔沁奶食品	采购单CG202603315468审核自动生成	1	2026-04-01 01:43:45.25821	2026-04-03 07:15:51.347658	
211	FK202604018227	CG202603312889	supplier	浙江金矿包装	611.76	2026-01-11	41	浙江金矿包装	采购单CG202603312889审核自动生成	1	2026-04-01 01:43:47.403954	2026-04-03 07:15:52.714868	
212	FK202604019908	CG202603319582	supplier	雷记炒货	200.00	2026-01-11	46	雷记炒货	采购单CG202603319582审核自动生成	1	2026-04-01 01:43:49.406824	2026-04-03 07:15:54.039993	
213	FK202604016600	CG202603313858	supplier	科尔沁奶食品	48.00	2026-01-11	40	科尔沁奶食品	采购单CG202603313858审核自动生成	1	2026-04-01 01:43:51.481076	2026-04-03 07:15:55.377825	
208	FK202604017105	CG202603313876	supplier	山东锦食食品	687.00	2026-01-09	23	山东锦食食品	采购单CG202603313876审核自动生成	1	2026-04-01 01:43:41.052815	2026-04-03 07:15:56.729876	
207	FK202604014153	CG202603319112	supplier	科尔沁奶食品	713.00	2026-01-07	40	科尔沁奶食品	采购单CG202603319112审核自动生成	1	2026-04-01 01:43:38.34387	2026-04-03 07:15:59.450502	
205	FK202604011134	CG202603312353	supplier	科尔沁奶食品	220.00	2026-01-06	40	科尔沁奶食品	采购单CG202603312353审核自动生成	1	2026-04-01 01:43:33.171388	2026-04-03 07:16:00.787214	
206	FK202604016135	CG202603316269	supplier	巴音珠萨朗	854.00	2026-01-06	31	巴音珠萨朗	采购单CG202603316269审核自动生成	1	2026-04-01 01:43:35.306984	2026-04-03 07:16:02.703639	
203	FK202604013348	CG202603311038	supplier	纯净奶食品	60.00	2026-01-03	39	纯净奶食品	采购单CG202603311038审核自动生成	1	2026-04-01 01:43:27.035093	2026-04-03 07:16:04.136992	
204	FK202604016807	CG202603315470	supplier	茁硕乐/牛肉干	980.00	2026-01-03	45	茁硕乐/牛肉干	采购单CG202603315470审核自动生成	1	2026-04-01 01:43:30.191728	2026-04-03 07:16:05.570681	
201	FK202604016715	CG202603318600	supplier	纯净奶食品	1396.00	2026-01-01	39	纯净奶食品	采购单CG202603318600审核自动生成	1	2026-04-01 01:43:21.605999	2026-04-03 07:16:06.935162	
202	FK202604011094	CG202603317448	supplier	纯净奶食品	424.40	2026-01-01	39	纯净奶食品	采购单CG202603317448审核自动生成	1	2026-04-01 01:43:24.38902	2026-04-03 07:16:08.303711	
200	FK202604017400	CG202603318172	supplier	奥都奶食品	315.00	2025-12-31	43	奥都奶食品	采购单CG202603318172审核自动生成	1	2026-04-01 01:43:18.465915	2026-04-03 07:16:09.656415	
199	FK202604014858	CG202603313512	supplier	永巨茶业	1388.00	2025-12-29	27	永巨茶业	采购单CG202603313512审核自动生成	1	2026-04-01 01:43:16.305868	2026-04-03 07:16:11.117957	
198	FK202604014698	CG202603315199	supplier	科尔沁奶食品	75.00	2025-12-28	40	科尔沁奶食品	采购单CG202603315199审核自动生成	1	2026-04-01 01:43:14.232411	2026-04-03 07:16:15.664024	
145	FK202604014235	CG202603311066	supplier	巴音珠萨朗	357.00	2025-11-16	31	巴音珠萨朗	采购单CG202603311066审核自动生成	1	2026-04-01 01:40:53.545062	2026-04-01 01:45:20.652233	
251	FK202604016208	CG202603318570	supplier	科尔沁奶食品	75.00	2026-03-01	40	科尔沁奶食品	采购单CG202603318570审核自动生成	1	2026-04-01 01:45:25.881319	2026-04-03 07:14:55.581558	
253	FK202604016278	CG202603318189	supplier	科尔沁奶食品	50.00	2026-03-01	40	科尔沁奶食品	采购单CG202603318189审核自动生成	1	2026-04-01 01:45:30.253505	2026-04-03 07:14:58.393279	
254	FK202604018888	CG202603319515	supplier	科尔沁奶食品	220.00	2026-03-01	40	科尔沁奶食品	采购单CG202603319515审核自动生成	1	2026-04-01 01:45:32.353841	2026-04-03 07:14:59.78019	
249	FK202604017159	CG202603311066	supplier	兴安盟杭盖奶制品厂	380.00	2026-02-27	48	兴安盟杭盖奶制品厂	采购单CG202603311066审核自动生成	1	2026-04-01 01:45:21.70952	2026-04-03 07:15:01.191776	
248	FK202604011010	CG202603318392	supplier	德吉奶食品	270.00	2026-02-26	57	德吉奶食品	采购单CG202603318392审核自动生成	1	2026-04-01 01:45:19.595205	2026-04-03 07:15:02.626075	
244	FK202604018036	CG202603318133	supplier	格日勒	100.00	2026-02-23	56	格日勒	采购单CG202603318133审核自动生成	1	2026-04-01 01:45:07.885988	2026-04-03 07:15:03.969551	
245	FK202604017425	CG202603311777	supplier	科尔沁奶食品	850.00	2026-02-23	40	科尔沁奶食品	采购单CG202603311777审核自动生成	1	2026-04-01 01:45:10.68822	2026-04-03 07:15:05.332853	
246	FK202604015509	CG202603314534	supplier	科尔沁奶食品	450.00	2026-02-23	40	科尔沁奶食品	采购单CG202603314534审核自动生成	1	2026-04-01 01:45:14.861715	2026-04-03 07:15:06.753739	
247	FK202604014007	CG202603318524	supplier	科尔沁奶食品	858.00	2026-02-23	40	科尔沁奶食品	采购单CG202603318524审核自动生成	1	2026-04-01 01:45:17.554042	2026-04-03 07:15:08.23627	
243	FK202604016007	CG202603315370	supplier	科尔沁奶食品	965.00	2026-02-14	40	科尔沁奶食品	采购单CG202603315370审核自动生成	1	2026-04-01 01:45:05.833117	2026-04-03 07:15:09.673528	
242	FK202604017496	CG202603312202	supplier	科尔沁奶食品	145.00	2026-02-12	40	科尔沁奶食品	采购单CG202603312202审核自动生成	1	2026-04-01 01:45:03.738678	2026-04-03 07:15:11.02385	
241	FK202604012245	CG202603315780	supplier	乌日汗奶食品店	90.00	2026-02-10	55	乌日汗奶食品店	采购单CG202603315780审核自动生成	1	2026-04-01 01:45:01.70066	2026-04-03 07:15:13.98126	
281	FK202604015842	CG202603303089	supplier	纯净奶食品	272.00	2025-12-12	39	纯净奶食品	采购单CG202603303089审核自动生成	1	2026-04-01 01:46:44.020407	2026-04-03 07:17:11.468227	
282	FK202604014099	CG202603308349	supplier	那牧尔乳制品厂/纯净之源	550.00	2025-12-12	32	那牧尔乳制品厂/纯净之源	采购单CG202603308349审核自动生成	1	2026-04-01 01:46:46.289007	2026-04-03 07:17:12.894446	
275	FK202604013429	CG202603305241	supplier	科尔沁奶食品	526.00	2025-12-10	40	科尔沁奶食品	采购单CG202603305241审核自动生成	1	2026-04-01 01:46:26.775216	2026-04-03 07:17:23.45995	
277	FK202604015130	CG202603305271	supplier	恩赫奶制品厂	554.40	2025-12-10	29	恩赫奶制品厂	采购单CG202603305271审核自动生成	1	2026-04-01 01:46:31.019276	2026-04-03 07:17:24.973312	
278	FK202604011297	CG202603304022	supplier	那牧尔乳制品厂/纯净之源	550.00	2025-12-10	32	那牧尔乳制品厂/纯净之源	采购单CG202603304022审核自动生成	1	2026-04-01 01:46:35.835926	2026-04-03 07:17:26.391713	
279	FK202604015853	CG202603302325	supplier	盛大印刷	963.00	2025-12-10	18	盛大印刷	采购单CG202603302325审核自动生成	1	2026-04-01 01:46:38.320582	2026-04-03 07:17:27.859483	
280	FK202604015128	CG202603309418	supplier	广州维记	3380.00	2025-12-10	28	广州维记	采购单CG202603309418审核自动生成	1	2026-04-01 01:46:41.301841	2026-04-03 07:17:29.331817	
272	FK202604019112	CG202603304854	supplier	科尔沁奶食品	48.00	2025-12-09	40	科尔沁奶食品	采购单CG202603304854审核自动生成	1	2026-04-01 01:46:18.672395	2026-04-03 07:17:36.713291	
273	FK202604017103	CG202603305554	supplier	科尔沁奶食品	25.00	2025-12-09	40	科尔沁奶食品	采购单CG202603305554审核自动生成	1	2026-04-01 01:46:22.533389	2026-04-03 07:17:38.13569	
274	FK202604015313	CG202603301508	supplier	科尔沁奶食品	751.00	2025-12-09	40	科尔沁奶食品	采购单CG202603301508审核自动生成	1	2026-04-01 01:46:24.602742	2026-04-03 07:17:39.84945	
271	FK202604014371	CG202603306172	supplier	奥都奶食品	240.00	2025-12-07	43	奥都奶食品	采购单CG202603306172审核自动生成	1	2026-04-01 01:46:16.491938	2026-04-03 07:17:44.118353	
266	FK202604016975	CG202603301177	supplier	拼多多/随机店采购	124.62	2025-12-05	36	拼多多/随机店采购	采购单CG202603301177审核自动生成	1	2026-04-01 01:46:02.896362	2026-04-03 07:17:52.686554	
267	FK202604015872	CG202603304977	supplier	那牧尔乳制品厂/纯净之源	220.00	2025-12-05	32	那牧尔乳制品厂/纯净之源	采购单CG202603304977审核自动生成	1	2026-04-01 01:46:06.943886	2026-04-03 07:17:54.086443	
268	FK202604016222	CG202603308245	supplier	科尔沁奶食品	166.00	2025-12-05	40	科尔沁奶食品	采购单CG202603308245审核自动生成	1	2026-04-01 01:46:10.003717	2026-04-03 07:17:55.639621	
269	FK202604012137	CG202603302270	supplier	杂/采购商	107.00	2025-12-05	42	杂/采购商	采购单CG202603302270审核自动生成	1	2026-04-01 01:46:12.099928	2026-04-03 07:17:57.037447	
270	FK202604015233	CG202603309410	supplier	纯净奶食品	2805.00	2025-12-05	39	纯净奶食品	采购单CG202603309410审核自动生成	1	2026-04-01 01:46:14.264776	2026-04-03 07:17:58.496059	
261	FK202604017681	CG202603306057	supplier	科尔沁奶食品	154.00	2025-12-04	40	科尔沁奶食品	采购单CG202603306057审核自动生成	1	2026-04-01 01:45:50.40781	2026-04-03 07:18:05.68004	
263	FK202604019397	CG202603302397	supplier	纯净奶食品	772.00	2025-12-04	39	纯净奶食品	采购单CG202603302397审核自动生成	1	2026-04-01 01:45:56.325333	2026-04-03 07:18:07.112314	
264	FK202604013112	CG202603309473	supplier	浙江金矿包装	2199.50	2025-12-04	41	浙江金矿包装	采购单CG202603309473审核自动生成	1	2026-04-01 01:45:58.501206	2026-04-03 07:18:08.562014	
265	FK202604016521	CG202603308185	supplier	盛大印刷	743.93	2025-12-04	18	盛大印刷	采购单CG202603308185审核自动生成	1	2026-04-01 01:46:00.623185	2026-04-03 07:18:10.059778	
262	FK202604018375	CG202603304535	supplier	纯净奶食品	2359.60	2025-12-03	39	纯净奶食品	采购单CG202603304535审核自动生成	1	2026-04-01 01:45:52.634137	2026-04-03 07:18:13.056365	
257	FK202604011854	CG202603306534	supplier	淘宝/杂	925.00	2025-12-01	38	淘宝/杂	采购单CG202603306534审核自动生成	1	2026-04-01 01:45:39.667756	2026-04-03 07:18:18.606514	
258	FK202604016004	CG202603305508	supplier	淘宝/江苏永发玻璃制品厂	648.00	2025-12-01	22	淘宝/江苏永发玻璃制品厂	采购单CG202603305508审核自动生成	1	2026-04-01 01:45:42.238113	2026-04-03 07:18:20.003731	
260	FK202604011264	CG202603306186	supplier	淘宝紫辰包装	70.40	2025-12-01	19	淘宝紫辰包装	采购单CG202603306186审核自动生成	1	2026-04-01 01:45:48.324139	2026-04-03 07:18:21.386151	
259	FK202604017564	CG202603308801	supplier	翁牛特旗奶果子	2146.00	2025-11-30	26	翁牛特旗奶果子	采购单CG202603308801审核自动生成	1	2026-04-01 01:45:45.155217	2026-04-03 07:18:24.123852	
255	FK202604011190	CG202603305055	supplier	盛大印刷	594.69	2025-11-16	18	盛大印刷	采购单CG202603305055审核自动生成	1	2026-04-01 01:45:34.439908	2026-04-03 07:18:35.767907	
256	FK202604014073	CG202603308739	supplier	民族印刷厂	96.00	2025-11-16	37	民族印刷厂	采购单CG202603308739审核自动生成	1	2026-04-01 01:45:37.593769	2026-04-03 07:18:37.192043	
276	FK202604014194	CG202603307063	supplier	恩赫奶制品厂	82.80	2025-10-20	29	恩赫奶制品厂	采购单CG202603307063审核自动生成	1	2026-04-01 01:46:28.891642	2026-04-03 07:18:53.278992	
250	FK202604015137	CG202603311089	supplier	科尔沁奶食品	110.00	2026-03-01	40	科尔沁奶食品	采购单CG202603311089审核自动生成	1	2026-04-01 01:45:23.856617	2026-04-03 07:14:54.199572	
252	FK202604012489	CG202603319830	supplier	科尔沁奶食品	50.00	2026-03-01	40	科尔沁奶食品	采购单CG202603319830审核自动生成	1	2026-04-01 01:45:28.089377	2026-04-03 07:14:57.033915	
240	FK202604012314	CG202603314546	supplier	科尔沁奶食品	50.00	2026-02-10	40	科尔沁奶食品	采购单CG202603314546审核自动生成	1	2026-04-01 01:44:59.623702	2026-04-03 07:15:12.407439	
209	FK202604013486	CG202603319904	supplier	翁牛特旗奶果子	3653.00	2026-01-09	26	翁牛特旗奶果子	采购单CG202603319904审核自动生成	1	2026-04-01 01:43:43.095785	2026-04-03 07:15:58.083105	
196	FK202604019320	CG202603314661	supplier	科尔沁奶食品	75.00	2025-12-28	40	科尔沁奶食品	采购单CG202603314661审核自动生成	1	2026-04-01 01:43:09.636583	2026-04-03 07:16:12.490306	
295	FK202604016820	CG202603309125	supplier	科尔沁奶食品	140.00	2025-12-25	40	科尔沁奶食品	采购单CG202603309125审核自动生成	1	2026-04-01 01:47:19.059171	2026-04-03 07:16:25.817507	
296	FK202604017481	CG202603305256	supplier	阿润查干	182.00	2025-12-25	44	阿润查干	采购单CG202603305256审核自动生成	1	2026-04-01 01:47:21.187135	2026-04-03 07:16:27.382517	
297	FK202604011768	CG202603309411	supplier	纯净奶食品	2310.00	2025-12-25	39	纯净奶食品	采购单CG202603309411审核自动生成	1	2026-04-01 01:47:23.394509	2026-04-03 07:16:28.941515	
298	FK202604011336	CG202603308630	supplier	盛大印刷	47.80	2025-12-25	18	盛大印刷	采购单CG202603308630审核自动生成	1	2026-04-01 01:47:25.587548	2026-04-03 07:16:30.536043	
294	FK202604018875	CG202603309170	supplier	科尔沁奶食品	150.00	2025-12-24	40	科尔沁奶食品	采购单CG202603309170审核自动生成	1	2026-04-01 01:47:16.880385	2026-04-03 07:16:33.509401	
293	FK202604012208	CG202603309920	supplier	纯净奶食品	325.00	2025-12-21	39	纯净奶食品	采购单CG202603309920审核自动生成	1	2026-04-01 01:47:14.825594	2026-04-03 07:16:36.55016	
292	FK202604016041	CG202603302336	supplier	奥都奶食品	352.00	2025-12-19	43	奥都奶食品	采购单CG202603302336审核自动生成	1	2026-04-01 01:47:12.663084	2026-04-03 07:16:39.677529	
289	FK202604014005	CG202603304928	supplier	杂/采购商	144.00	2025-12-17	42	杂/采购商	采购单CG202603304928审核自动生成	1	2026-04-01 01:47:04.936531	2026-04-03 07:16:48.181333	
290	FK202604013430	CG202603304184	supplier	纯净奶食品	971.50	2025-12-17	39	纯净奶食品	采购单CG202603304184审核自动生成	1	2026-04-01 01:47:06.987186	2026-04-03 07:16:49.586304	
291	FK202604019147	CG202603301141	supplier	科尔沁奶食品	555.00	2025-12-17	40	科尔沁奶食品	采购单CG202603301141审核自动生成	1	2026-04-01 01:47:09.467944	2026-04-03 07:16:51.288747	
287	FK202604013753	CG202603303596	supplier	巴音珠萨朗	184.00	2025-12-16	31	巴音珠萨朗	采购单CG202603303596审核自动生成	1	2026-04-01 01:46:59.117911	2026-04-03 07:16:55.948185	
288	FK202604019634	CG202603308467	supplier	恩赫奶制品厂	216.00	2025-12-16	29	恩赫奶制品厂	采购单CG202603308467审核自动生成	1	2026-04-01 01:47:02.525231	2026-04-03 07:16:57.483212	
181	FK202604011922	CG202603312951	supplier	那牧尔乳制品厂/纯净之源	390.00	2025-12-14	32	那牧尔乳制品厂/纯净之源	采购单CG202603312951审核自动生成	1	2026-04-01 01:42:33.627987	2026-04-03 07:17:00.467733	
285	FK202604016446	CG202603308629	supplier	科尔沁奶食品	235.00	2025-12-14	40	科尔沁奶食品	采购单CG202603308629审核自动生成	1	2026-04-01 01:46:53.540287	2026-04-03 07:17:02.048094	
286	FK202604012753	CG202603306282	supplier	那牧尔乳制品厂/纯净之源	390.00	2025-12-14	32	那牧尔乳制品厂/纯净之源	采购单CG202603306282审核自动生成	1	2026-04-01 01:46:56.085938	2026-04-03 07:17:03.64797	
284	FK202604019917	CG202603309372	supplier	奥都奶食品	128.00	2025-12-13	43	奥都奶食品	采购单CG202603309372审核自动生成	1	2026-04-01 01:46:51.402299	2026-04-03 07:17:06.616484	
283	FK202604019983	CG202603302265	supplier	杂/采购商	21.00	2025-12-10	42	杂/采购商	采购单CG202603302265审核自动生成	1	2026-04-01 01:46:48.625627	2026-04-03 07:17:30.727893	
154	FK202604015500	CG202603318201	supplier	淘宝/江苏永发玻璃制品厂	648.00	2025-12-01	22	淘宝/江苏永发玻璃制品厂	采购单CG202603318201审核自动生成	1	2026-04-01 01:41:18.694416	2026-04-03 07:18:15.803099	
112	FK202604015407	CG202603319788	supplier	沈阳乾兴包装	254.80	2025-09-30	21	沈阳乾兴包装	采购单CG202603319788审核自动生成	1	2026-04-01 01:39:27.994738	2026-04-03 07:19:34.811598	
\.


--
-- Data for Name: prepay_record; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.prepay_record (id, order_sn, pay_type, supplier_id, supplier_name, customer_id, customer_name, amount, pay_date, fund_id, fund_name, admin_name, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: procure_inhouse; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.procure_inhouse (id, order_no, purchase_order_id, supplier_id, supplier_name, admin_name, in_date, goods_info, remark, status, warehouse_id, warehouse_name, created_at, deleted_at) FROM stdin;
63	CGRK202603317521	356	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-23	[{"num": 10, "spec": "1斤", "price": 85, "unit_id": 0, "goods_id": 908, "goods_sn": "SP0000127", "unit_name": "袋", "goods_name": "哈斯乌拉牛肉干500g原味", "total_price": 850}]	从saas.mzth.cn导入 原单号:CG0004427	0	0		2026-03-31 15:24:12.474996	\N
58	CGRK202603318354	349	98	科尔沁奶食品	1号店员专用	2026-03-01	[{"num": 5, "spec": "1斤散称", "price": 10, "unit_id": 0, "goods_id": 922, "goods_sn": "SP0000113", "unit_name": "斤", "goods_name": "酸奶炒米糖/散装", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0004471	0	0		2026-03-31 15:24:00.033793	\N
59	CGRK202603314800	348	98	科尔沁奶食品	1号店员专用	2026-03-01	[{"num": 10, "spec": "斤", "price": 5, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0004472	0	0		2026-03-31 15:24:02.204131	\N
52	CGRK202603318453	502	123	银河包装	牧区纯坊官方品牌	2025-09-30	[{"num": 51, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 36.21}, {"num": 84, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 59.64}, {"num": 2, "spec": "1", "price": 35.5, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "捆", "goods_name": "专袋/奶条", "total_price": 71}, {"num": 48, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 34.08}]	从saas.mzth.cn导入 原单号:CG0002000	0	0		2026-03-31 12:12:17.780137	\N
55	CGRK202603311619	501	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	[{"num": 32, "spec": "1", "price": 0.87, "unit_id": 0, "goods_id": 1032, "goods_sn": "SP0000002", "unit_name": "张", "goods_name": "专盒/冻炒米", "total_price": 27.84}]	从saas.mzth.cn导入 原单号:CG0002001	0	0		2026-03-31 13:10:04.715785	\N
51	CGRK202603318146	0	123	银河包装	牧区纯坊官方品牌	2025-09-30	[{"num": 51, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 36.21}, {"num": 84, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 59.64}, {"num": 2, "spec": "1", "price": 35.5, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "捆", "goods_name": "专袋/奶条", "total_price": 71}, {"num": 48, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 34.08}]	从saas.mzth.cn导入 原单号:CG0002000	0	0		2026-03-31 05:42:04.364303	2026-03-31 13:58:09.941134
54	CGRK202603317994	0	0			\N	[]		1	0		2026-03-31 12:30:23.447606	2026-03-31 13:58:11.629338
57	CGRK202603319747	350	98	科尔沁奶食品	1号店员专用	2026-03-01	[{"num": 5, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 75}]	从saas.mzth.cn导入 原单号:CG0004470	0	0		2026-03-31 15:23:57.887107	\N
56	CGRK202603315191	347	98	科尔沁奶食品	1号店员专用	2026-03-01	[{"num": 10, "spec": "斤/两盒", "price": 22, "unit_id": 0, "goods_id": 981, "goods_sn": "SP0000053", "unit_name": "盒", "goods_name": "烤奶皮", "total_price": 220}]	从saas.mzth.cn导入 原单号:CG0004473	0	0		2026-03-31 13:32:42.580142	\N
60	CGRK202603312834	352	84	兴安盟杭盖奶制品厂	牧区纯坊官方品牌	2026-02-27	[{"num": 20, "spec": "1", "price": 19, "unit_id": 0, "goods_id": 857, "goods_sn": "SP0000178", "unit_name": "张", "goods_name": "厚奶皮", "total_price": 380}]	从saas.mzth.cn导入 原单号:CG0004457	0	0		2026-03-31 15:24:04.307566	\N
62	CGRK202603316519	357	75	格日勒	牧区纯坊官方品牌	2026-02-23	[{"num": 12, "spec": "250克", "price": 8.33333, "unit_id": 0, "goods_id": 811, "goods_sn": "SP0000225", "unit_name": "袋", "goods_name": "蒙古果子/格日勒", "total_price": 100}]	从saas.mzth.cn导入 原单号:CG0004426	0	0		2026-03-31 15:24:09.263907	\N
71	CGRK202603312902	362	98	科尔沁奶食品	1号店员专用	2026-02-09	[{"num": 30, "spec": "1斤", "price": 5.26667, "unit_id": 0, "goods_id": 901, "goods_sn": "SP0000134", "unit_name": "麻袋", "goods_name": "手工白花炒米/散装", "total_price": 158}]	从saas.mzth.cn导入 原单号:CG0004383	0	0		2026-03-31 15:24:30.72287	\N
73	CGRK202603317175	366	84	兴安盟杭盖奶制品厂	牧区纯坊官方品牌	2026-02-04	[{"num": 20, "spec": "1", "price": 19, "unit_id": 0, "goods_id": 857, "goods_sn": "SP0000178", "unit_name": "张", "goods_name": "厚奶皮", "total_price": 380}]	从saas.mzth.cn导入 原单号:CG0004287	0	0		2026-03-31 15:24:34.994535	\N
75	CGRK202603317026	369	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-01	[{"num": 40, "spec": "斤/两盒", "price": 22, "unit_id": 0, "goods_id": 981, "goods_sn": "SP0000053", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 880}, {"num": 3, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 903, "goods_sn": "SP0000132", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/甜味", "total_price": 57}, {"num": 4, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 904, "goods_sn": "SP0000131", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/原味", "total_price": 76}, {"num": 10, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 150}]	从saas.mzth.cn导入 原单号:CG0004239	0	0		2026-03-31 15:24:39.466409	\N
76	CGRK202603313622	368	86	雷记炒货	牧区纯坊官方品牌	2026-02-01	[{"num": 10, "spec": "散称", "price": 10, "unit_id": 0, "goods_id": 860, "goods_sn": "SP0000175", "unit_name": "散", "goods_name": "普通瓜子", "total_price": 100}]	从saas.mzth.cn导入 原单号:CG0004241	0	0		2026-03-31 15:24:41.729024	\N
78	CGRK202603314323	373	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-27	[{"num": 10, "spec": "半斤", "price": 14, "unit_id": 0, "goods_id": 916, "goods_sn": "SP0000119", "unit_name": "斤", "goods_name": "脆奶条/散装/科尔沁", "total_price": 140}]	从saas.mzth.cn导入 原单号:CG0004088	0	0		2026-03-31 15:24:46.157236	\N
79	CGRK202603318569	372	81	额吉伊德	牧区纯坊官方品牌	2026-01-27	[{"num": 20, "spec": "250克", "price": 4.5, "unit_id": 0, "goods_id": 845, "goods_sn": "SP0000190", "unit_name": "瓶", "goods_name": "乳清饮料", "total_price": 90}, {"num": 6, "spec": "250克", "price": 6, "unit_id": 0, "goods_id": 846, "goods_sn": "SP0000189", "unit_name": "瓶", "goods_name": "酸奶/额吉伊德", "total_price": 36}, {"num": 5, "spec": "500克", "price": 7, "unit_id": 0, "goods_id": 847, "goods_sn": "SP0000188", "unit_name": "袋", "goods_name": "乌日莫/袋装", "total_price": 35}]	从saas.mzth.cn导入 原单号:CG0004116	0	0		2026-03-31 15:24:48.938811	\N
81	CGRK202603315542	370	79	沈阳包装	牧区纯坊官方品牌	2026-01-27	[{"num": 540, "spec": "1", "price": 5.1592, "unit_id": 0, "goods_id": 836, "goods_sn": "SP0000199", "unit_name": "个", "goods_name": "礼盒/2026", "total_price": 2785.97}]	从saas.mzth.cn导入 原单号:CG0004118	0	0		2026-03-31 15:24:53.382627	\N
64	CGRK202603317495	355	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-23	[{"num": 5, "spec": "1.2", "price": 33, "unit_id": 0, "goods_id": 856, "goods_sn": "SP0000179", "unit_name": "张", "goods_name": "科尔沁/大奶豆腐", "total_price": 165}, {"num": 5, "spec": "1", "price": 19, "unit_id": 0, "goods_id": 829, "goods_sn": "SP0000207", "unit_name": "张", "goods_name": "奶豆腐/原味/中/科尔沁", "total_price": 95}, {"num": 5, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 903, "goods_sn": "SP0000132", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/甜味", "total_price": 95}, {"num": 5, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 904, "goods_sn": "SP0000131", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/原味", "total_price": 95}]	从saas.mzth.cn导入 原单号:CG0004428	0	0		2026-03-31 15:24:14.48023	\N
66	CGRK202603312507	358	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-14	[{"num": 2, "spec": "1斤", "price": 95, "unit_id": 0, "goods_id": 907, "goods_sn": "SP0000128", "unit_name": "袋", "goods_name": "风干牛肉500g大片", "total_price": 190}, {"num": 10, "spec": "半斤", "price": 14, "unit_id": 0, "goods_id": 916, "goods_sn": "SP0000119", "unit_name": "斤", "goods_name": "脆奶条/散装/科尔沁", "total_price": 140}, {"num": 5, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 903, "goods_sn": "SP0000132", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/甜味", "total_price": 95}, {"num": 5, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 904, "goods_sn": "SP0000131", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/原味", "total_price": 95}, {"num": 5, "spec": "半斤装", "price": 15, "unit_id": 0, "goods_id": 823, "goods_sn": "SP0000213", "unit_name": "瓶", "goods_name": "黄油/中瓶", "total_price": 75}, {"num": 5, "spec": "半斤装", "price": 21, "unit_id": 0, "goods_id": 822, "goods_sn": "SP0000214", "unit_name": "瓶", "goods_name": "黄油/大瓶/科尔沁", "total_price": 105}, {"num": 5, "spec": "1", "price": 19, "unit_id": 0, "goods_id": 829, "goods_sn": "SP0000207", "unit_name": "张", "goods_name": "奶豆腐/原味/中/科尔沁", "total_price": 95}, {"num": 2, "spec": "1斤", "price": 85, "unit_id": 0, "goods_id": 908, "goods_sn": "SP0000127", "unit_name": "袋", "goods_name": "哈斯乌拉牛肉干500g原味", "total_price": 170}]	从saas.mzth.cn导入 原单号:CG0004417	0	0		2026-03-31 15:24:18.921491	\N
68	CGRK202603314071	361	98	科尔沁奶食品	1号店员专用	2026-02-10	[{"num": 10, "spec": "斤", "price": 5, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0004384	0	0		2026-03-31 15:24:23.254861	\N
69	CGRK202603315252	360	76	乌日汗奶食品店	1号店员专用	2026-02-10	[{"num": 3, "spec": "300ml", "price": 15, "unit_id": 0, "goods_id": 825, "goods_sn": "SP0000211", "unit_name": "盒", "goods_name": "故乡宝酸马奶", "total_price": 45}, {"num": 5, "spec": "500克", "price": 9, "unit_id": 0, "goods_id": 826, "goods_sn": "SP0000210", "unit_name": "盒", "goods_name": "乌日汗酸奶", "total_price": 45}]	从saas.mzth.cn导入 原单号:CG0004387	0	0		2026-03-31 15:24:25.314864	\N
70	CGRK202603316821	363	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-09	[{"num": 5, "spec": "1", "price": 19, "unit_id": 0, "goods_id": 829, "goods_sn": "SP0000207", "unit_name": "张", "goods_name": "奶豆腐/原味/中/科尔沁", "total_price": 95}]	从saas.mzth.cn导入 原单号:CG0004368	0	0		2026-03-31 15:24:27.457615	\N
74	CGRK202603313280	365	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-04	[{"num": 10, "spec": "斤", "price": 5, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0004288	0	0		2026-03-31 15:24:37.233418	\N
80	CGRK202603318071	371	80	奥特尔奶食品店	牧区纯坊官方品牌	2026-01-27	[{"num": 3, "spec": "2斤装", "price": 32, "unit_id": 0, "goods_id": 838, "goods_sn": "SP0000197", "unit_name": "袋", "goods_name": "奶粉蒙古国", "total_price": 96}, {"num": 4, "spec": "360克", "price": 12, "unit_id": 0, "goods_id": 839, "goods_sn": "SP0000196", "unit_name": "袋", "goods_name": "奶皮子粉", "total_price": 48}, {"num": 2, "spec": "300克", "price": 15, "unit_id": 0, "goods_id": 840, "goods_sn": "SP0000195", "unit_name": "盒", "goods_name": "奶茶粉战粮", "total_price": 30}, {"num": 2, "spec": "400克", "price": 18, "unit_id": 0, "goods_id": 841, "goods_sn": "SP0000194", "unit_name": "袋", "goods_name": "奶茶粉贡格尔", "total_price": 36}, {"num": 2, "spec": "400克", "price": 22, "unit_id": 0, "goods_id": 842, "goods_sn": "SP0000193", "unit_name": "袋", "goods_name": "努德勒沁调和茶", "total_price": 44}, {"num": 2, "spec": "400克", "price": 22, "unit_id": 0, "goods_id": 843, "goods_sn": "SP0000192", "unit_name": "袋", "goods_name": "阿依古丽奶茶专用红茶", "total_price": 44}, {"num": 2, "spec": "400克", "price": 22, "unit_id": 0, "goods_id": 844, "goods_sn": "SP0000191", "unit_name": "盒", "goods_name": "希日嘎拉奶茶专用茶", "total_price": 44}, {"num": 5, "spec": "1一斤", "price": 28, "unit_id": 0, "goods_id": 837, "goods_sn": "SP0000198", "unit_name": "袋", "goods_name": "甜味奶豆腐块儿/大", "total_price": 140}, {"num": 2, "spec": "400克", "price": 22, "unit_id": 0, "goods_id": 844, "goods_sn": "SP0000191", "unit_name": "盒", "goods_name": "希日嘎拉奶茶专用茶", "total_price": 44}]	从saas.mzth.cn导入 原单号:CG0004117	0	0		2026-03-31 15:24:51.133992	\N
85	CGRK202603311311	378	82	阿齐图/巴林右旗	牧区纯坊官方品牌	2026-01-20	[{"num": 5, "spec": "孜然", "price": 98, "unit_id": 0, "goods_id": 852, "goods_sn": "SP0000183", "unit_name": "斤", "goods_name": "牛肉干/散/孜然", "total_price": 490}, {"num": 5, "spec": "香辣", "price": 98, "unit_id": 0, "goods_id": 853, "goods_sn": "SP0000182", "unit_name": "斤", "goods_name": "牛肉干/散/香辣", "total_price": 490}, {"num": 5, "spec": "原味", "price": 98, "unit_id": 0, "goods_id": 854, "goods_sn": "SP0000181", "unit_name": "斤", "goods_name": "牛肉干/散/原味", "total_price": 490}]	从saas.mzth.cn导入 原单号:CG0003935	0	0		2026-03-31 15:25:02.045581	\N
87	CGRK202603313441	376	93	杂/采购商	牧区纯坊官方品牌	2026-01-20	[{"num": 100, "spec": "1", "price": 0.4936, "unit_id": 0, "goods_id": 850, "goods_sn": "SP0000185", "unit_name": "张", "goods_name": "红糖袋/delicious", "total_price": 49.36}]	从saas.mzth.cn导入 原单号:CG0003944	0	0		2026-03-31 15:25:06.693267	\N
106	CGRK202603313723	397	88	茁硕乐/牛肉干	牧区纯坊官方品牌	2026-01-03	[{"num": 20, "spec": "250克", "price": 49, "unit_id": 0, "goods_id": 865, "goods_sn": "SP0000170", "unit_name": "袋", "goods_name": "牛肉干/和希格图", "total_price": 980}]	从saas.mzth.cn导入 原单号:CG0003505	0	0		2026-03-31 15:25:57.371901	\N
120	CGRK202603313621	256	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-25	[{"num": 9, "spec": "1", "price": 10, "unit_id": 0, "goods_id": 884, "goods_sn": "SP0000151", "unit_name": "个", "goods_name": "实惠/奶豆腐", "total_price": 90}, {"num": 10, "spec": "斤", "price": 5, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0003253	0	0		2026-03-31 15:26:29.130509	\N
67	CGRK202603313924	359	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-12	[{"num": 30, "spec": "10斤装/麻袋", "price": 4.83333, "unit_id": 0, "goods_id": 923, "goods_sn": "SP0000112", "unit_name": "斤", "goods_name": "炒米/散装/硬口", "total_price": 145}]	从saas.mzth.cn导入 原单号:CG0004414	0	0		2026-03-31 15:24:21.133736	\N
72	CGRK202603317338	364	78	小米厂家阿旗	牧区纯坊官方品牌	2026-02-08	[{"num": 2, "spec": "2.5kg", "price": 19, "unit_id": 0, "goods_id": 830, "goods_sn": "SP0000206", "unit_name": "袋", "goods_name": "小米/10斤/小袋", "total_price": 38}, {"num": 5, "spec": "2.5kg", "price": 19, "unit_id": 0, "goods_id": 830, "goods_sn": "SP0000206", "unit_name": "袋", "goods_name": "小米/10斤/小袋", "total_price": 95}, {"num": 8, "spec": "10斤装", "price": 55, "unit_id": 0, "goods_id": 809, "goods_sn": "SP0000227", "unit_name": "盒", "goods_name": "10斤装/小米/绿色纸盒", "total_price": 440}]	从saas.mzth.cn导入 原单号:CG0004363	0	0		2026-03-31 15:24:32.880886	\N
77	CGRK202603311146	367	90	阿润查干	牧区纯坊官方品牌	2026-02-01	[{"num": 10, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 880, "goods_sn": "SP0000155", "unit_name": "袋", "goods_name": "阿润月饼/五仁馅", "total_price": 100}, {"num": 5, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 882, "goods_sn": "SP0000153", "unit_name": "袋", "goods_name": "阿润月饼/黄油渣馅", "total_price": 50}, {"num": 5, "spec": "1斤装", "price": 10, "unit_id": 0, "goods_id": 831, "goods_sn": "SP0000205", "unit_name": "袋", "goods_name": "果条/阿润", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0004242	0	0		2026-03-31 15:24:44.070563	\N
83	CGRK202603315575	380	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-20	[{"num": 10, "spec": "斤", "price": 8, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 80}]	从saas.mzth.cn导入 原单号:CG0003930	0	0		2026-03-31 15:24:57.559143	\N
84	CGRK202603316221	379	83	扎旗吉十奶制品	牧区纯坊官方品牌	2026-01-20	[{"num": 5, "spec": "散", "price": 18, "unit_id": 0, "goods_id": 855, "goods_sn": "SP0000180", "unit_name": "散", "goods_name": "奶锅巴/扎旗吉十奶制品", "total_price": 90}]	从saas.mzth.cn导入 原单号:CG0003933	0	0		2026-03-31 15:24:59.803048	\N
86	CGRK202603315216	377	85	糖炮	牧区纯坊官方品牌	2026-01-20	[{"num": 10, "spec": "3根", "price": 14, "unit_id": 0, "goods_id": 851, "goods_sn": "SP0000184", "unit_name": "盒", "goods_name": "晴王糖葫芦", "total_price": 140}]	从saas.mzth.cn导入 原单号:CG0003936	0	0		2026-03-31 15:25:04.603175	\N
88	CGRK202603314948	375	106	拼多多/热缩膜	牧区纯坊官方品牌	2026-01-20	[{"num": 2000, "spec": "1", "price": 0.07, "unit_id": 0, "goods_id": 993, "goods_sn": "SP0000041", "unit_name": "张", "goods_name": "冻炒米专用/塑膜袋", "total_price": 140}]	从saas.mzth.cn导入 原单号:CG0003945	0	0		2026-03-31 15:25:08.884844	\N
90	CGRK202603315956	381	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2026-01-19	[{"num": 130, "spec": "140克", "price": 48.95385, "unit_id": 0, "goods_id": 872, "goods_sn": "SP0000163", "unit_name": "袋", "goods_name": "半成品/黄金纬度牛肉干/那牧尔", "total_price": 6364}]	从saas.mzth.cn导入 原单号:CG0003899	0	0		2026-03-31 15:25:13.380618	\N
92	CGRK202603314690	383	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-17	[{"num": 10, "spec": "斤/两盒", "price": 22, "unit_id": 0, "goods_id": 981, "goods_sn": "SP0000053", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 220}, {"num": 30, "spec": "1斤", "price": 5.26667, "unit_id": 0, "goods_id": 901, "goods_sn": "SP0000134", "unit_name": "麻袋", "goods_name": "手工白花炒米/散装", "total_price": 158}]	从saas.mzth.cn导入 原单号:CG0003873	0	0		2026-03-31 15:25:21.292573	\N
95	CGRK202603319187	385	113	永巨茶业	牧区纯坊官方品牌	2026-01-16	[{"num": 10, "spec": "1件2000包/300元/1件", "price": 331, "unit_id": 0, "goods_id": 1011, "goods_sn": "SP0000023", "unit_name": "件", "goods_name": "茶包", "total_price": 3310}]	从saas.mzth.cn导入 原单号:CG0003840	0	0		2026-03-31 15:25:28.785444	\N
99	CGRK202603318844	388	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-11	[{"num": 10, "spec": "500g", "price": 4.8, "unit_id": 0, "goods_id": 931, "goods_sn": "SP0000104", "unit_name": "袋", "goods_name": "炒米粉/aag", "total_price": 48}]	从saas.mzth.cn导入 原单号:CG0003707	0	0		2026-03-31 15:25:39.651145	\N
100	CGRK202603314559	393	108	山东锦食食品	牧区纯坊官方品牌	2026-01-09	[{"num": 10, "spec": "2g", "price": 68.7, "unit_id": 0, "goods_id": 997, "goods_sn": "SP0000037", "unit_name": "件", "goods_name": "茶专用/盐包", "total_price": 687}]	从saas.mzth.cn导入 原单号:CG0003666	0	0		2026-03-31 15:25:42.707435	\N
101	CGRK202603319311	392	105	翁牛特旗奶果子	牧区纯坊官方品牌	2026-01-09	[{"num": 119, "spec": "平均一块儿", "price": 30.69748, "unit_id": 0, "goods_id": 991, "goods_sn": "SP0000043", "unit_name": "斤", "goods_name": "奶果子/散装", "total_price": 3653}]	从saas.mzth.cn导入 原单号:CG0003667	0	0		2026-03-31 15:25:46.03454	\N
103	CGRK202603313499	396	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-06	[{"num": 10, "spec": "斤/两盒", "price": 22, "unit_id": 0, "goods_id": 981, "goods_sn": "SP0000053", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 220}]	从saas.mzth.cn导入 原单号:CG0003544	0	0		2026-03-31 15:25:50.741306	\N
104	CGRK202603314896	395	117	巴音珠萨朗	牧区纯坊官方品牌	2026-01-06	[{"num": 53.4, "spec": "250克/一袋", "price": 15.99251, "unit_id": 0, "goods_id": 1014, "goods_sn": "SP0000020", "unit_name": "斤", "goods_name": "散装/甜味奶条", "total_price": 854}]	从saas.mzth.cn导入 原单号:CG0003546	0	0		2026-03-31 15:25:52.900183	\N
105	CGRK202603314814	398	97	纯净奶食品	牧区纯坊官方品牌	2026-01-03	[{"num": 10, "spec": "400ke", "price": 6, "unit_id": 0, "goods_id": 866, "goods_sn": "SP0000169", "unit_name": "瓶", "goods_name": "酸奶/纯净", "total_price": 60}]	从saas.mzth.cn导入 原单号:CG0003504	0	0		2026-03-31 15:25:55.073172	\N
96	CGRK202603312455	391	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-11	[{"num": 10, "spec": "斤", "price": 5, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0003704	0	0		2026-03-31 15:25:30.870458	\N
91	CGRK202603316752	384	84	兴安盟杭盖奶制品厂	牧区纯坊官方品牌	2026-01-17	[{"num": 10, "spec": "1", "price": 19, "unit_id": 0, "goods_id": 857, "goods_sn": "SP0000178", "unit_name": "张", "goods_name": "厚奶皮", "total_price": 190}]	从saas.mzth.cn导入 原单号:CG0003860	0	0		2026-03-31 15:25:17.947635	\N
97	CGRK202603315735	390	96	浙江金矿包装	牧区纯坊官方品牌	2026-01-11	[{"num": 720, "spec": "7.4X7.4X7.8 奶豆腐/冻炒米通用", "price": 0.84967, "unit_id": 0, "goods_id": 963, "goods_sn": "SP0000071", "unit_name": "盒", "goods_name": "小/方形/亚克力盒/", "total_price": 611.76}]	从saas.mzth.cn导入 原单号:CG0003705	0	0		2026-03-31 15:25:33.142877	\N
93	CGRK202603313952	387	90	阿润查干	牧区纯坊官方品牌	2026-01-16	[{"num": 10, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 879, "goods_sn": "SP0000156", "unit_name": "盒", "goods_name": "干肉奶茶", "total_price": 55}, {"num": 25, "spec": "奶油炒米/ 黑芝麻/ 乌日莫糖/ 酸奶炒米/ 奶油花生", "price": 25, "unit_id": 0, "goods_id": 859, "goods_sn": "SP0000176", "unit_name": "4030", "goods_name": "糖/阿润", "total_price": 625}]	从saas.mzth.cn导入 原单号:CG0003838	0	0		2026-03-31 15:25:23.937057	\N
94	CGRK202603319491	386	85	糖炮	牧区纯坊官方品牌	2026-01-16	[{"num": 40, "spec": "3棵", "price": 6, "unit_id": 0, "goods_id": 858, "goods_sn": "SP0000177", "unit_name": "盒", "goods_name": "糖葫芦", "total_price": 240}]	从saas.mzth.cn导入 原单号:CG0003839	0	0		2026-03-31 15:25:26.106661	\N
98	CGRK202603317076	389	86	雷记炒货	牧区纯坊官方品牌	2026-01-11	[{"num": 5, "spec": "散称", "price": 10, "unit_id": 0, "goods_id": 860, "goods_sn": "SP0000175", "unit_name": "散", "goods_name": "普通瓜子", "total_price": 50}, {"num": 10, "spec": "散称", "price": 15, "unit_id": 0, "goods_id": 861, "goods_sn": "SP0000174", "unit_name": "散", "goods_name": "五香瓜子", "total_price": 150}]	从saas.mzth.cn导入 原单号:CG0003706	0	0		2026-03-31 15:25:35.303767	\N
115	CGRK202603313167	410	90	阿润查干	牧区纯坊官方品牌	2025-12-25	[{"num": 4, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 880, "goods_sn": "SP0000155", "unit_name": "袋", "goods_name": "阿润月饼/五仁馅", "total_price": 40}, {"num": 4, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 879, "goods_sn": "SP0000156", "unit_name": "盒", "goods_name": "干肉奶茶", "total_price": 22}, {"num": 4, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 881, "goods_sn": "SP0000154", "unit_name": "袋", "goods_name": "阿润月饼/奶皮子馅", "total_price": 40}, {"num": 4, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 882, "goods_sn": "SP0000153", "unit_name": "袋", "goods_name": "阿润月饼/黄油渣馅", "total_price": 40}, {"num": 4, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 883, "goods_sn": "SP0000152", "unit_name": "袋", "goods_name": "阿润月饼/奶豆腐馅", "total_price": 40}]	从saas.mzth.cn导入 原单号:CG0003285	0	0		2026-03-31 15:26:17.984444	\N
117	CGRK202603316909	408	121	盛大印刷	牧区纯坊官方品牌	2025-12-25	[{"num": 500, "spec": "1", "price": 0.0956, "unit_id": 0, "goods_id": 1024, "goods_sn": "SP0000010", "unit_name": "张", "goods_name": "标签/不干胶/奶条/甜味", "total_price": 47.8}]	从saas.mzth.cn导入 原单号:CG0003288	0	0		2026-03-31 15:26:22.455307	\N
128	CGRK202603316789	414	92	奥都奶食品	牧区纯坊官方品牌	2025-12-19	[{"num": 13.25, "spec": "1", "price": 16, "unit_id": 0, "goods_id": 885, "goods_sn": "SP0000150", "unit_name": "斤", "goods_name": "冻炒米/散装", "total_price": 212}, {"num": 5, "spec": "1", "price": 12, "unit_id": 0, "goods_id": 884, "goods_sn": "SP0000151", "unit_name": "个", "goods_name": "实惠/奶豆腐", "total_price": 60}, {"num": 10, "spec": "300克", "price": 8, "unit_id": 0, "goods_id": 924, "goods_sn": "SP0000111", "unit_name": "袋", "goods_name": "冻炒米/袋装", "total_price": 80}]	从saas.mzth.cn导入 原单号:CG0003106	0	0		2026-03-31 15:26:46.257419	\N
82	CGRK202603312174	374	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-24	[{"num": 5, "spec": "1斤散称", "price": 22, "unit_id": 0, "goods_id": 902, "goods_sn": "SP0000133", "unit_name": "斤", "goods_name": "乌日莫糖/散装", "total_price": 110}, {"num": 5, "spec": "1斤散称", "price": 10, "unit_id": 0, "goods_id": 922, "goods_sn": "SP0000113", "unit_name": "斤", "goods_name": "酸奶炒米糖/散装", "total_price": 50}, {"num": 5, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 75}, {"num": 5, "spec": "1.2", "price": 33, "unit_id": 0, "goods_id": 856, "goods_sn": "SP0000179", "unit_name": "张", "goods_name": "科尔沁/大奶豆腐", "total_price": 165}]	从saas.mzth.cn导入 原单号:CG0004043	0	0		2026-03-31 15:24:55.475607	\N
107	CGRK202603312715	400	97	纯净奶食品	牧区纯坊官方品牌	2026-01-01	[{"num": 10, "spec": "斤", "price": 10, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 100}, {"num": 36, "spec": "200克", "price": 10, "unit_id": 0, "goods_id": 970, "goods_sn": "SP0000064", "unit_name": "盒", "goods_name": "热奶豆腐碗", "total_price": 360}, {"num": 20, "spec": "200克", "price": 13, "unit_id": 0, "goods_id": 939, "goods_sn": "SP0000096", "unit_name": "盒", "goods_name": "半成品/透明/原味/鲜奶酪", "total_price": 260}, {"num": 52, "spec": "200克", "price": 13, "unit_id": 0, "goods_id": 940, "goods_sn": "SP0000095", "unit_name": "盒", "goods_name": "半成品/透明/甜味/鲜奶酪", "total_price": 676}]	从saas.mzth.cn导入 原单号:CG0003473	0	0		2026-03-31 15:25:59.59343	\N
109	CGRK202603316006	401	92	奥都奶食品	牧区纯坊官方品牌	2025-12-31	[{"num": 5, "spec": "半斤装", "price": 11, "unit_id": 0, "goods_id": 918, "goods_sn": "SP0000117", "unit_name": "瓶", "goods_name": "黄油/半斤", "total_price": 55}, {"num": 5, "spec": "400克", "price": 20, "unit_id": 0, "goods_id": 919, "goods_sn": "SP0000116", "unit_name": "瓶", "goods_name": "黄油/斤", "total_price": 100}, {"num": 10, "spec": "1", "price": 16, "unit_id": 0, "goods_id": 885, "goods_sn": "SP0000150", "unit_name": "斤", "goods_name": "冻炒米/散装", "total_price": 160}]	从saas.mzth.cn导入 原单号:CG0004240	0	0		2026-03-31 15:26:04.018988	\N
108	CGRK202603316444	399	97	纯净奶食品	牧区纯坊官方品牌	2026-01-01	[{"num": 21, "spec": "150克", "price": 12, "unit_id": 0, "goods_id": 944, "goods_sn": "SP0000091", "unit_name": "盒", "goods_name": "半成品/透明/奶皮千层", "total_price": 252}, {"num": 10, "spec": "1", "price": 15, "unit_id": 0, "goods_id": 885, "goods_sn": "SP0000150", "unit_name": "斤", "goods_name": "冻炒米/散装", "total_price": 150}, {"num": 100, "spec": "7克/包", "price": 0.224, "unit_id": 0, "goods_id": 863, "goods_sn": "SP0000172", "unit_name": "个", "goods_name": "冻炒米/小包散/精品", "total_price": 22.4}]	从saas.mzth.cn导入 原单号:CG0003668	0	0		2026-03-31 15:26:01.880281	\N
111	CGRK202603317078	405	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-28	[{"num": 6, "spec": "1一斤装", "price": 12.5, "unit_id": 0, "goods_id": 878, "goods_sn": "SP0000157", "unit_name": "盒", "goods_name": "羊奶粉/1斤", "total_price": 75}]	从saas.mzth.cn导入 原单号:CG0003393	0	0		2026-03-31 15:26:08.405395	\N
112	CGRK202603318850	404	117	巴音珠萨朗	牧区纯坊官方品牌	2025-12-28	[{"num": 18.8, "spec": "250克/一袋", "price": 16.5, "unit_id": 0, "goods_id": 1014, "goods_sn": "SP0000020", "unit_name": "斤", "goods_name": "散装/甜味奶条", "total_price": 310.2}]	从saas.mzth.cn导入 原单号:CG0003398	0	0		2026-03-31 15:26:10.678402	\N
113	CGRK202603315913	403	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-28	[{"num": 5, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 75}]	从saas.mzth.cn导入 原单号:CG0003418	0	0		2026-03-31 15:26:12.886849	\N
114	CGRK202603313988	411	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-25	[{"num": 9, "spec": "1", "price": 10, "unit_id": 0, "goods_id": 884, "goods_sn": "SP0000151", "unit_name": "个", "goods_name": "实惠/奶豆腐", "total_price": 90}, {"num": 10, "spec": "斤", "price": 5, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0003253	0	0		2026-03-31 15:26:15.060336	\N
118	CGRK202603313318	407	121	盛大印刷	牧区纯坊官方品牌	2025-12-25	[{"num": 500, "spec": "1张", "price": 0.067, "unit_id": 0, "goods_id": 898, "goods_sn": "SP0000137", "unit_name": "张", "goods_name": "透专标签/奶皮千层", "total_price": 33.5}]	从saas.mzth.cn导入 原单号:CG0003289	0	0		2026-03-31 15:26:24.746346	\N
119	CGRK202603312826	406	121	盛大印刷	牧区纯坊官方品牌	2025-12-25	[{"num": 500, "spec": "1", "price": 0.0432, "unit_id": 0, "goods_id": 983, "goods_sn": "SP0000051", "unit_name": "张", "goods_name": "甜味/标签/不干胶/传统奶豆腐", "total_price": 21.6}, {"num": 500, "spec": "1", "price": 0.0432, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 21.6}]	从saas.mzth.cn导入 原单号:CG0003290	0	0		2026-03-31 15:26:26.864919	\N
127	CGRK202603312506	258	97	纯净奶食品	牧区纯坊官方品牌	2025-12-21	[{"num": 25, "spec": "180克", "price": 13, "unit_id": 0, "goods_id": 945, "goods_sn": "SP0000090", "unit_name": "盒", "goods_name": "半成品/透明/奶皮卷", "total_price": 325}]	从saas.mzth.cn导入 原单号:CG0003139	0	0		2026-03-31 15:26:43.987736	\N
129	CGRK202603316714	259	92	奥都奶食品	牧区纯坊官方品牌	2025-12-19	[{"num": 13.25, "spec": "1", "price": 16, "unit_id": 0, "goods_id": 885, "goods_sn": "SP0000150", "unit_name": "斤", "goods_name": "冻炒米/散装", "total_price": 212}, {"num": 5, "spec": "1", "price": 12, "unit_id": 0, "goods_id": 884, "goods_sn": "SP0000151", "unit_name": "个", "goods_name": "实惠/奶豆腐", "total_price": 60}, {"num": 10, "spec": "300克", "price": 8, "unit_id": 0, "goods_id": 924, "goods_sn": "SP0000111", "unit_name": "袋", "goods_name": "冻炒米/袋装", "total_price": 80}]	从saas.mzth.cn导入 原单号:CG0003106	0	0		2026-03-31 15:26:49.489461	\N
130	CGRK202603313188	417	93	杂/采购商	牧区纯坊官方品牌	2025-12-17	[{"num": 12, "spec": "1", "price": 12, "unit_id": 0, "goods_id": 890, "goods_sn": "SP0000145", "unit_name": "斤", "goods_name": "红枣", "total_price": 144}]	从saas.mzth.cn导入 原单号:CG0003074	0	0		2026-03-31 15:26:51.652811	\N
230	CGRK202603311837	476	106	拼多多/热缩膜	牧区纯坊官方品牌	2025-10-01	[{"num": 500, "spec": "1", "price": 0.1, "unit_id": 0, "goods_id": 993, "goods_sn": "SP0000041", "unit_name": "张", "goods_name": "冻炒米专用/塑膜袋", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0002175	0	0		2026-03-31 15:30:47.985621	\N
123	CGRK202603312169	253	121	盛大印刷	牧区纯坊官方品牌	2025-12-25	[{"num": 500, "spec": "1", "price": 0.0956, "unit_id": 0, "goods_id": 1024, "goods_sn": "SP0000010", "unit_name": "张", "goods_name": "标签/不干胶/奶条/甜味", "total_price": 47.8}]	从saas.mzth.cn导入 原单号:CG0003288	0	0		2026-03-31 15:26:35.425827	\N
131	CGRK202603314149	416	97	纯净奶食品	牧区纯坊官方品牌	2025-12-17	[{"num": 17, "spec": "150克", "price": 14.5, "unit_id": 0, "goods_id": 973, "goods_sn": "SP0000061", "unit_name": "袋", "goods_name": "精品/奶豆腐块儿/甜味/", "total_price": 246.5}, {"num": 50, "spec": "150克", "price": 14.5, "unit_id": 0, "goods_id": 986, "goods_sn": "SP0000048", "unit_name": "袋", "goods_name": "精品/奶豆腐块儿/原味", "total_price": 725}]	从saas.mzth.cn导入 原单号:CG0003075	0	0		2026-03-31 15:26:53.774306	\N
133	CGRK202603319636	262	93	杂/采购商	牧区纯坊官方品牌	2025-12-17	[{"num": 12, "spec": "1", "price": 12, "unit_id": 0, "goods_id": 890, "goods_sn": "SP0000145", "unit_name": "斤", "goods_name": "红枣", "total_price": 144}]	从saas.mzth.cn导入 原单号:CG0003074	0	0		2026-03-31 15:26:58.31621	\N
140	CGRK202603313871	421	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-14	[{"num": 5, "spec": "1斤散称", "price": 22, "unit_id": 0, "goods_id": 902, "goods_sn": "SP0000133", "unit_name": "斤", "goods_name": "乌日莫糖/散装", "total_price": 110}, {"num": 5, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 75}, {"num": 5, "spec": "1斤散称", "price": 10, "unit_id": 0, "goods_id": 922, "goods_sn": "SP0000113", "unit_name": "斤", "goods_name": "酸奶炒米糖/散装", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0003015	0	0		2026-03-31 15:27:14.099603	\N
124	CGRK202603315278	412	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-24	[{"num": 10, "spec": "1盒", "price": 15, "unit_id": 0, "goods_id": 889, "goods_sn": "SP0000146", "unit_name": "盒", "goods_name": "奶皮卷/科尔沁", "total_price": 150}]	从saas.mzth.cn导入 原单号:CG0003217	0	0		2026-03-31 15:26:37.496597	\N
125	CGRK202603312674	257	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-24	[{"num": 10, "spec": "1盒", "price": 15, "unit_id": 0, "goods_id": 889, "goods_sn": "SP0000146", "unit_name": "盒", "goods_name": "奶皮卷/科尔沁", "total_price": 150}]	从saas.mzth.cn导入 原单号:CG0003217	0	0		2026-03-31 15:26:39.685083	\N
126	CGRK202603312304	413	97	纯净奶食品	牧区纯坊官方品牌	2025-12-21	[{"num": 25, "spec": "180克", "price": 13, "unit_id": 0, "goods_id": 945, "goods_sn": "SP0000090", "unit_name": "盒", "goods_name": "半成品/透明/奶皮卷", "total_price": 325}]	从saas.mzth.cn导入 原单号:CG0003139	0	0		2026-03-31 15:26:41.888012	\N
137	CGRK202603311843	418	116	恩赫奶制品厂	牧区纯坊官方品牌	2025-12-16	[{"num": 12, "spec": "250克/一袋", "price": 18, "unit_id": 0, "goods_id": 1015, "goods_sn": "SP0000019", "unit_name": "斤", "goods_name": "散装/原味奶条", "total_price": 216}]	从saas.mzth.cn导入 原单号:CG0003057	0	0		2026-03-31 15:27:07.431025	\N
234	CGRK202603319931	500	123	银河包装	牧区纯坊官方品牌	2025-09-30	[{"num": 30, "spec": "1", "price": 0.37, "unit_id": 0, "goods_id": 1031, "goods_sn": "SP0000003", "unit_name": "张", "goods_name": "专底盒/奶条", "total_price": 11.1}, {"num": 3, "spec": "1", "price": 18.5, "unit_id": 0, "goods_id": 1031, "goods_sn": "SP0000003", "unit_name": "捆", "goods_name": "专底盒/奶条", "total_price": 55.5}]	从saas.mzth.cn导入 原单号:CG0002002	0	0		2026-03-31 15:30:57.998001	\N
236	CGRK202603318955	498	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	[{"num": 16, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1028, "goods_sn": "SP0000006", "unit_name": "张", "goods_name": "专标签/黄油", "total_price": 0.96}]	从saas.mzth.cn导入 原单号:CG0002004	0	0		2026-03-31 15:31:02.50267	\N
227	CGRK202603315535	479	121	盛大印刷	牧区纯坊官方品牌	2025-10-01	[{"num": 1000, "spec": "0", "price": 0.32, "unit_id": 0, "goods_id": 998, "goods_sn": "SP0000036", "unit_name": "张", "goods_name": "茶专用/硫酸纸", "total_price": 320}, {"num": 1000, "spec": "0", "price": 0.04, "unit_id": 0, "goods_id": 999, "goods_sn": "SP0000035", "unit_name": "张", "goods_name": "茶专用/不干胶/标签", "total_price": 40}]	从saas.mzth.cn导入 原单号:CG0002154	0	0		2026-03-31 15:30:40.852317	\N
231	CGRK202603318731	475	105	翁牛特旗奶果子	牧区纯坊官方品牌	2025-10-01	[{"num": 18.24, "spec": "平均一块儿", "price": 25, "unit_id": 0, "goods_id": 991, "goods_sn": "SP0000043", "unit_name": "斤", "goods_name": "奶果子/散装", "total_price": 456}]	从saas.mzth.cn导入 原单号:CG0002176	0	0		2026-03-31 15:30:50.500702	\N
139	CGRK202603317384	263	116	恩赫奶制品厂	牧区纯坊官方品牌	2025-12-16	[{"num": 12, "spec": "250克/一袋", "price": 18, "unit_id": 0, "goods_id": 1015, "goods_sn": "SP0000019", "unit_name": "斤", "goods_name": "散装/原味奶条", "total_price": 216}]	从saas.mzth.cn导入 原单号:CG0003057	0	0		2026-03-31 15:27:11.909921	\N
153	CGRK202603319871	427	121	盛大印刷	牧区纯坊官方品牌	2025-12-10	[{"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 900, "goods_sn": "SP0000135", "unit_name": "张", "goods_name": "透专标签/脆香奶条/微甜", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 950, "goods_sn": "SP0000085", "unit_name": "张", "goods_name": "透专标签/奶皮卷", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 951, "goods_sn": "SP0000084", "unit_name": "张", "goods_name": "透专标签/冻炒米", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 952, "goods_sn": "SP0000083", "unit_name": "张", "goods_name": "透专标签/奶酪/原味", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 953, "goods_sn": "SP0000082", "unit_name": "张", "goods_name": "透专标签/奶酪/甜味", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 956, "goods_sn": "SP0000079", "unit_name": "张", "goods_name": "透专标签/鲜奶皮", "total_price": 160.5}]	从saas.mzth.cn导入 原单号:CG0002955	0	0		2026-03-31 15:27:44.966186	\N
232	CGRK202603317539	474	106	拼多多/热缩膜	牧区纯坊官方品牌	2025-10-01	[{"num": 1000, "spec": "1", "price": 0.1, "unit_id": 0, "goods_id": 990, "goods_sn": "SP0000044", "unit_name": "袋", "goods_name": "奶果子/专用塑膜袋", "total_price": 100}]	从saas.mzth.cn导入 原单号:CG0002177	0	0		2026-03-31 15:30:52.753887	\N
233	CGRK202603313009	473	105	翁牛特旗奶果子	牧区纯坊官方品牌	2025-10-01	[{"num": 14.4, "spec": "平均一块儿", "price": 25, "unit_id": 0, "goods_id": 991, "goods_sn": "SP0000043", "unit_name": "斤", "goods_name": "奶果子/散装", "total_price": 360}]	从saas.mzth.cn导入 原单号:CG0002178	0	0		2026-03-31 15:30:55.031042	\N
176	CGRK202603311851	285	101	拼多多/随机店采购	牧区纯坊官方品牌	2025-12-05	[{"num": 100, "spec": "500克装", "price": 0.7882, "unit_id": 0, "goods_id": 949, "goods_sn": "SP0000086", "unit_name": "张", "goods_name": "专袋/乌日莫/炒米", "total_price": 78.82}, {"num": 100, "spec": "250克装", "price": 0.458, "unit_id": 0, "goods_id": 948, "goods_sn": "SP0000087", "unit_name": "张", "goods_name": "专袋/乌日莫", "total_price": 45.8}]	从saas.mzth.cn导入 原单号:CG0002856	0	0		2026-03-31 15:28:44.405844	\N
136	CGRK202603314424	419	117	巴音珠萨朗	牧区纯坊官方品牌	2025-12-16	[{"num": 23, "spec": "250克/一袋", "price": 8, "unit_id": 0, "goods_id": 1014, "goods_sn": "SP0000020", "unit_name": "斤", "goods_name": "散装/甜味奶条", "total_price": 184}]	从saas.mzth.cn导入 原单号:CG0003056	0	0		2026-03-31 15:27:05.270562	\N
170	CGRK202603317772	280	92	奥都奶食品	牧区纯坊官方品牌	2025-12-07	[{"num": 5, "spec": "300克", "price": 8, "unit_id": 0, "goods_id": 924, "goods_sn": "SP0000111", "unit_name": "袋", "goods_name": "冻炒米/袋装", "total_price": 40}, {"num": 2, "spec": "斤", "price": 9, "unit_id": 0, "goods_id": 917, "goods_sn": "SP0000118", "unit_name": "斤", "goods_name": "机器乌日末液体", "total_price": 18}, {"num": 10, "spec": "斤", "price": 8, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 80}, {"num": 2, "spec": "半斤装", "price": 11, "unit_id": 0, "goods_id": 918, "goods_sn": "SP0000117", "unit_name": "瓶", "goods_name": "黄油/半斤", "total_price": 22}, {"num": 4, "spec": "400克", "price": 20, "unit_id": 0, "goods_id": 919, "goods_sn": "SP0000116", "unit_name": "瓶", "goods_name": "黄油/斤", "total_price": 80}]	从saas.mzth.cn导入 原单号:CG0002900	0	0		2026-03-31 15:28:30.592503	\N
134	CGRK202603315779	261	97	纯净奶食品	牧区纯坊官方品牌	2025-12-17	[{"num": 17, "spec": "150克", "price": 14.5, "unit_id": 0, "goods_id": 973, "goods_sn": "SP0000061", "unit_name": "袋", "goods_name": "精品/奶豆腐块儿/甜味/", "total_price": 246.5}, {"num": 50, "spec": "150克", "price": 14.5, "unit_id": 0, "goods_id": 986, "goods_sn": "SP0000048", "unit_name": "袋", "goods_name": "精品/奶豆腐块儿/原味", "total_price": 725}]	从saas.mzth.cn导入 原单号:CG0003075	0	0		2026-03-31 15:27:00.947549	\N
138	CGRK202603314244	264	117	巴音珠萨朗	牧区纯坊官方品牌	2025-12-16	[{"num": 23, "spec": "250克/一袋", "price": 8, "unit_id": 0, "goods_id": 1014, "goods_sn": "SP0000020", "unit_name": "斤", "goods_name": "散装/甜味奶条", "total_price": 184}]	从saas.mzth.cn导入 原单号:CG0003056	0	0		2026-03-31 15:27:09.687635	\N
172	CGRK202603318027	439	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2025-12-05	[{"num": 40, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_sn": "SP0000021", "unit_name": "盒", "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 220}]	从saas.mzth.cn导入 原单号:CG0002857	0	0		2026-03-31 15:28:35.280046	\N
174	CGRK202603317210	437	93	杂/采购商	牧区纯坊官方品牌	2025-12-05	[{"num": 2, "spec": "400克", "price": 3.5, "unit_id": 0, "goods_id": 929, "goods_sn": "SP0000106", "unit_name": "袋", "goods_name": "白砂糖", "total_price": 7}, {"num": 1, "spec": "1", "price": 90, "unit_id": 0, "goods_id": 1002, "goods_sn": "SP0000032", "unit_name": "台", "goods_name": "封口机/真空", "total_price": 90}, {"num": 300, "spec": "大/中/小", "price": 0.03333, "unit_id": 0, "goods_id": 928, "goods_sn": "SP0000107", "unit_name": "袋", "goods_name": "塑料购物袋", "total_price": 10}]	从saas.mzth.cn导入 原单号:CG0002864	0	0		2026-03-31 15:28:39.849078	\N
187	CGRK202603318706	287	96	浙江金矿包装	牧区纯坊官方品牌	2025-12-04	[{"num": 240, "spec": "7.4X7.4X7.8 奶豆腐/冻炒米通用", "price": 0.8, "unit_id": 0, "goods_id": 963, "goods_sn": "SP0000071", "unit_name": "盒", "goods_name": "小/方形/亚克力盒/", "total_price": 192}, {"num": 258, "spec": "85X85X63 鲜奶皮", "price": 0.85, "unit_id": 0, "goods_id": 962, "goods_sn": "SP0000072", "unit_name": "盒", "goods_name": "中/方形/亚克力盒/", "total_price": 219.3}, {"num": 200, "spec": "31g", "price": 0.85, "unit_id": 0, "goods_id": 960, "goods_sn": "SP0000075", "unit_name": "盒", "goods_name": "三角/奶皮千层盒", "total_price": 170}, {"num": 300, "spec": "182X120X28/烤奶豆腐片/奶皮卷", "price": 1.75, "unit_id": 0, "goods_id": 961, "goods_sn": "SP0000074", "unit_name": "盒", "goods_name": "扁盒/亚克力/带内托", "total_price": 525}, {"num": 246, "spec": "235X170X35", "price": 2.6, "unit_id": 0, "goods_id": 959, "goods_sn": "SP0000076", "unit_name": "盒", "goods_name": "大/牛薄脆盒/亚克力", "total_price": 639.6}, {"num": 183, "spec": "乳清奶条盒", "price": 1.2, "unit_id": 0, "goods_id": 958, "goods_sn": "SP0000077", "unit_name": "盒", "goods_name": "小/长方/亚克力/乳清奶条盒", "total_price": 219.6}, {"num": 180, "spec": "待包换/冻炒米 145X85X55", "price": 1.3, "unit_id": 0, "goods_id": 957, "goods_sn": "SP0000078", "unit_name": "盒", "goods_name": "大/长方/亚克力/待用", "total_price": 234}]	从saas.mzth.cn导入 原单号:CG0002853	0	0		2026-03-31 15:29:09.638029	\N
141	CGRK202603316826	420	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2025-12-14	[{"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 891, "goods_sn": "SP0000144", "unit_name": "小包", "goods_name": "芝士奶豆腐月饼", "total_price": 50}, {"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 893, "goods_sn": "SP0000142", "unit_name": "小包", "goods_name": "奶豆腐月饼", "total_price": 50}, {"num": 10, "spec": "250", "price": 4, "unit_id": 0, "goods_id": 892, "goods_sn": "SP0000143", "unit_name": "盒", "goods_name": "那牧尔酸奶", "total_price": 40}, {"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 895, "goods_sn": "SP0000140", "unit_name": "小包", "goods_name": "黄油渣月饼", "total_price": 50}, {"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 896, "goods_sn": "SP0000139", "unit_name": "小包", "goods_name": "奶皮月饼", "total_price": 50}, {"num": 10, "spec": "5", "price": 10, "unit_id": 0, "goods_id": 897, "goods_sn": "SP0000138", "unit_name": "袋", "goods_name": "早餐包/那牧尔", "total_price": 100}, {"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 894, "goods_sn": "SP0000141", "unit_name": "小包", "goods_name": "酸奶月饼", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0003017	0	0		2026-03-31 15:27:16.23511	\N
142	CGRK202603313985	266	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-14	[{"num": 5, "spec": "1斤散称", "price": 22, "unit_id": 0, "goods_id": 902, "goods_sn": "SP0000133", "unit_name": "斤", "goods_name": "乌日莫糖/散装", "total_price": 110}, {"num": 5, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 75}, {"num": 5, "spec": "1斤散称", "price": 10, "unit_id": 0, "goods_id": 922, "goods_sn": "SP0000113", "unit_name": "斤", "goods_name": "酸奶炒米糖/散装", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0003015	0	0		2026-03-31 15:27:18.443344	\N
145	CGRK202603311412	267	92	奥都奶食品	牧区纯坊官方品牌	2025-12-13	[{"num": 10, "spec": "斤", "price": 8, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 80}, {"num": 4, "spec": "斤", "price": 12, "unit_id": 0, "goods_id": 917, "goods_sn": "SP0000118", "unit_name": "斤", "goods_name": "机器乌日末液体", "total_price": 48}]	从saas.mzth.cn导入 原单号:CG0003007	0	0		2026-03-31 15:27:25.37443	\N
149	CGRK202603315380	269	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2025-12-12	[{"num": 100, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_sn": "SP0000021", "unit_name": "盒", "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 550}]	从saas.mzth.cn导入 原单号:CG0002993	0	0		2026-03-31 15:27:34.285506	\N
150	CGRK202603314294	430	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-10	[{"num": 30, "spec": "1斤", "price": 5.46667, "unit_id": 0, "goods_id": 901, "goods_sn": "SP0000134", "unit_name": "麻袋", "goods_name": "手工白花炒米/散装", "total_price": 164}, {"num": 5, "spec": "1斤散称", "price": 22, "unit_id": 0, "goods_id": 902, "goods_sn": "SP0000133", "unit_name": "斤", "goods_name": "乌日莫糖/散装", "total_price": 110}, {"num": 4, "spec": "250克", "price": 8, "unit_id": 0, "goods_id": 915, "goods_sn": "SP0000120", "unit_name": "盒", "goods_name": "黄油渣/盒", "total_price": 32}, {"num": 10, "spec": "斤/两盒", "price": 22, "unit_id": 0, "goods_id": 981, "goods_sn": "SP0000053", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 220}]	从saas.mzth.cn导入 原单号:CG0002950	0	0		2026-03-31 15:27:36.618316	\N
151	CGRK202603311418	429	116	恩赫奶制品厂	牧区纯坊官方品牌	2025-12-10	[{"num": 30.8, "spec": "250克/一袋", "price": 18, "unit_id": 0, "goods_id": 1015, "goods_sn": "SP0000019", "unit_name": "斤", "goods_name": "散装/原味奶条", "total_price": 554.4}]	从saas.mzth.cn导入 原单号:CG0002952	0	0		2026-03-31 15:27:38.968015	\N
152	CGRK202603318659	428	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2025-12-10	[{"num": 100, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_sn": "SP0000021", "unit_name": "盒", "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 550}]	从saas.mzth.cn导入 原单号:CG0002953	0	0		2026-03-31 15:27:41.957	\N
154	CGRK202603316302	426	112	广州维记	牧区纯坊官方品牌	2025-12-10	[{"num": 20, "spec": "400/箱/0.423/球", "price": 169, "unit_id": 0, "goods_id": 1010, "goods_sn": "SP0000024", "unit_name": "件", "goods_name": "奶油球", "total_price": 3380}]	从saas.mzth.cn导入 原单号:CG0002956	0	0		2026-03-31 15:27:49.070989	\N
65	CGRK202603313556	354	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-23	[{"num": 5, "spec": "1斤", "price": 95, "unit_id": 0, "goods_id": 907, "goods_sn": "SP0000128", "unit_name": "袋", "goods_name": "风干牛肉500g大片", "total_price": 475}, {"num": 5, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 75}, {"num": 20, "spec": "500克", "price": 5.5, "unit_id": 0, "goods_id": 932, "goods_sn": "SP0000103", "unit_name": "袋", "goods_name": "炒米海丰", "total_price": 110}, {"num": 10, "spec": "500g", "price": 4.8, "unit_id": 0, "goods_id": 931, "goods_sn": "SP0000104", "unit_name": "袋", "goods_name": "炒米粉/aag", "total_price": 48}, {"num": 10, "spec": "半斤装", "price": 15, "unit_id": 0, "goods_id": 823, "goods_sn": "SP0000213", "unit_name": "瓶", "goods_name": "黄油/中瓶", "total_price": 150}]	从saas.mzth.cn导入 原单号:CG0004429	0	0		2026-03-31 15:24:16.605994	\N
146	CGRK202603316842	424	97	纯净奶食品	牧区纯坊官方品牌	2025-12-12	[{"num": 6, "spec": "1斤装", "price": 22, "unit_id": 0, "goods_id": 899, "goods_sn": "SP0000136", "unit_name": "瓶", "goods_name": "纯净/黄油/斤", "total_price": 132}, {"num": 10, "spec": "180克", "price": 14, "unit_id": 0, "goods_id": 945, "goods_sn": "SP0000090", "unit_name": "盒", "goods_name": "半成品/透明/奶皮卷", "total_price": 140}]	从saas.mzth.cn导入 原单号:CG0002992	0	0		2026-03-31 15:27:27.550805	\N
147	CGRK202603317749	423	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2025-12-12	[{"num": 100, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_sn": "SP0000021", "unit_name": "盒", "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 550}]	从saas.mzth.cn导入 原单号:CG0002993	0	0		2026-03-31 15:27:29.737729	\N
148	CGRK202603313127	270	97	纯净奶食品	牧区纯坊官方品牌	2025-12-12	[{"num": 6, "spec": "1斤装", "price": 22, "unit_id": 0, "goods_id": 899, "goods_sn": "SP0000136", "unit_name": "瓶", "goods_name": "纯净/黄油/斤", "total_price": 132}, {"num": 10, "spec": "180克", "price": 14, "unit_id": 0, "goods_id": 945, "goods_sn": "SP0000090", "unit_name": "盒", "goods_name": "半成品/透明/奶皮卷", "total_price": 140}]	从saas.mzth.cn导入 原单号:CG0002992	0	0		2026-03-31 15:27:31.927036	\N
229	CGRK202603318063	477	123	银河包装	牧区纯坊官方品牌	2025-10-01	[{"num": 200, "spec": "1", "price": 2, "unit_id": 0, "goods_id": 1009, "goods_sn": "SP0000025", "unit_name": "张", "goods_name": "专盒/青砖奶茶外盒", "total_price": 400}]	从saas.mzth.cn导入 原单号:CG0002174	0	0		2026-03-31 15:30:45.766758	\N
157	CGRK202603313522	274	116	恩赫奶制品厂	牧区纯坊官方品牌	2025-12-10	[{"num": 30.8, "spec": "250克/一袋", "price": 18, "unit_id": 0, "goods_id": 1015, "goods_sn": "SP0000019", "unit_name": "斤", "goods_name": "散装/原味奶条", "total_price": 554.4}]	从saas.mzth.cn导入 原单号:CG0002952	0	0		2026-03-31 15:27:56.336214	\N
169	CGRK202603317882	434	111	优如包装	牧区纯坊官方品牌	2025-12-07	[{"num": 3000, "spec": "140克", "price": 1.46667, "unit_id": 0, "goods_id": 873, "goods_sn": "SP0000162", "unit_name": "袋", "goods_name": "专袋/牛肉干包装", "total_price": 4400.01}]	从saas.mzth.cn导入 原单号:CG0003407	0	0		2026-03-31 15:28:28.388614	\N
171	CGRK202603315624	440	101	拼多多/随机店采购	牧区纯坊官方品牌	2025-12-05	[{"num": 100, "spec": "500克装", "price": 0.7882, "unit_id": 0, "goods_id": 949, "goods_sn": "SP0000086", "unit_name": "张", "goods_name": "专袋/乌日莫/炒米", "total_price": 78.82}, {"num": 100, "spec": "250克装", "price": 0.458, "unit_id": 0, "goods_id": 948, "goods_sn": "SP0000087", "unit_name": "张", "goods_name": "专袋/乌日莫", "total_price": 45.8}]	从saas.mzth.cn导入 原单号:CG0002856	0	0		2026-03-31 15:28:32.945032	\N
155	CGRK202603314799	425	93	杂/采购商	牧区纯坊官方品牌	2025-12-10	[{"num": 6, "spec": "400克", "price": 3.5, "unit_id": 0, "goods_id": 929, "goods_sn": "SP0000106", "unit_name": "袋", "goods_name": "白砂糖", "total_price": 21}]	从saas.mzth.cn导入 原单号:CG0002994	0	0		2026-03-31 15:27:51.444869	\N
158	CGRK202603314722	273	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2025-12-10	[{"num": 100, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_sn": "SP0000021", "unit_name": "盒", "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 550}]	从saas.mzth.cn导入 原单号:CG0002953	0	0		2026-03-31 15:27:59.155894	\N
160	CGRK202603317292	271	112	广州维记	牧区纯坊官方品牌	2025-12-10	[{"num": 20, "spec": "400/箱/0.423/球", "price": 169, "unit_id": 0, "goods_id": 1010, "goods_sn": "SP0000024", "unit_name": "件", "goods_name": "奶油球", "total_price": 3380}]	从saas.mzth.cn导入 原单号:CG0002956	0	0		2026-03-31 15:28:03.780607	\N
162	CGRK202603311073	433	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-09	[{"num": 1, "spec": "10斤装/麻袋", "price": 48, "unit_id": 0, "goods_id": 923, "goods_sn": "SP0000112", "unit_name": "麻袋", "goods_name": "炒米/散装/硬口", "total_price": 48}]	从saas.mzth.cn导入 原单号:CG0002908	0	0		2026-03-31 15:28:09.64507	\N
165	CGRK202603317247	279	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-09	[{"num": 1, "spec": "10斤装/麻袋", "price": 48, "unit_id": 0, "goods_id": 923, "goods_sn": "SP0000112", "unit_name": "麻袋", "goods_name": "炒米/散装/硬口", "total_price": 48}]	从saas.mzth.cn导入 原单号:CG0002908	0	0		2026-03-31 15:28:18.094637	\N
173	CGRK202603318023	438	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-05	[{"num": 5, "spec": "500克", "price": 12, "unit_id": 0, "goods_id": 930, "goods_sn": "SP0000105", "unit_name": "袋", "goods_name": "加沙奶豆腐", "total_price": 60}, {"num": 10, "spec": "500g", "price": 4.8, "unit_id": 0, "goods_id": 931, "goods_sn": "SP0000104", "unit_name": "袋", "goods_name": "炒米粉/aag", "total_price": 48}, {"num": 10, "spec": "500克", "price": 5.8, "unit_id": 0, "goods_id": 932, "goods_sn": "SP0000103", "unit_name": "袋", "goods_name": "炒米海丰", "total_price": 58}]	从saas.mzth.cn导入 原单号:CG0002863	0	0		2026-03-31 15:28:37.537908	\N
178	CGRK202603313573	283	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-05	[{"num": 5, "spec": "500克", "price": 12, "unit_id": 0, "goods_id": 930, "goods_sn": "SP0000105", "unit_name": "袋", "goods_name": "加沙奶豆腐", "total_price": 60}, {"num": 10, "spec": "500g", "price": 4.8, "unit_id": 0, "goods_id": 931, "goods_sn": "SP0000104", "unit_name": "袋", "goods_name": "炒米粉/aag", "total_price": 48}, {"num": 10, "spec": "500克", "price": 5.8, "unit_id": 0, "goods_id": 932, "goods_sn": "SP0000103", "unit_name": "袋", "goods_name": "炒米海丰", "total_price": 58}]	从saas.mzth.cn导入 原单号:CG0002863	0	0		2026-03-31 15:28:48.913965	\N
164	CGRK202603316985	431	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-09	[{"num": 2, "spec": "1斤", "price": 95, "unit_id": 0, "goods_id": 907, "goods_sn": "SP0000128", "unit_name": "袋", "goods_name": "风干牛肉500g大片", "total_price": 190}, {"num": 2, "spec": "1斤", "price": 83, "unit_id": 0, "goods_id": 908, "goods_sn": "SP0000127", "unit_name": "袋", "goods_name": "哈斯乌拉牛肉干500g原味", "total_price": 166}, {"num": 2, "spec": "450g", "price": 7, "unit_id": 0, "goods_id": 909, "goods_sn": "SP0000126", "unit_name": "袋", "goods_name": "蓝旗绿乳糖惠虹糖", "total_price": 14}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 910, "goods_sn": "SP0000125", "unit_name": "袋", "goods_name": "蓝旗绿乳糖奶香酥", "total_price": 8}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 911, "goods_sn": "SP0000124", "unit_name": "袋", "goods_name": "蓝旗绿乳糖果仁酥", "total_price": 8}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 912, "goods_sn": "SP0000123", "unit_name": "袋", "goods_name": "蓝旗绿乳糖水果", "total_price": 8}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 913, "goods_sn": "SP0000122", "unit_name": "袋", "goods_name": "蓝旗绿乳糖黄油球", "total_price": 8}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 914, "goods_sn": "SP0000121", "unit_name": "袋", "goods_name": "蓝旗绿乳糖炼乳", "total_price": 8}, {"num": 1, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 15}, {"num": 1, "spec": "1斤散称", "price": 10, "unit_id": 0, "goods_id": 922, "goods_sn": "SP0000113", "unit_name": "斤", "goods_name": "酸奶炒米糖/散装", "total_price": 10}, {"num": 4, "spec": "250克", "price": 8, "unit_id": 0, "goods_id": 915, "goods_sn": "SP0000120", "unit_name": "盒", "goods_name": "黄油渣/盒", "total_price": 32}, {"num": 10, "spec": "半斤", "price": 14, "unit_id": 0, "goods_id": 916, "goods_sn": "SP0000119", "unit_name": "斤", "goods_name": "脆奶条/散装/科尔沁", "total_price": 140}, {"num": 2, "spec": "500g", "price": 17, "unit_id": 0, "goods_id": 905, "goods_sn": "SP0000130", "unit_name": "袋", "goods_name": "真空奶豆腐砖/甜味", "total_price": 34}, {"num": 2, "spec": "500g", "price": 17, "unit_id": 0, "goods_id": 906, "goods_sn": "SP0000129", "unit_name": "袋", "goods_name": "真空奶豆腐砖/原味", "total_price": 34}, {"num": 2, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 903, "goods_sn": "SP0000132", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/甜味", "total_price": 38}, {"num": 2, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 904, "goods_sn": "SP0000131", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/原味", "total_price": 38}]	从saas.mzth.cn导入 原单号:CG0002914	0	0		2026-03-31 15:28:15.572876	\N
206	CGRK202603317281	296	121	盛大印刷	牧区纯坊官方品牌	2025-11-16	[{"num": 500, "spec": "1", "price": 0.0578, "unit_id": 0, "goods_id": 1019, "goods_sn": "SP0000015", "unit_name": "张", "goods_name": "标签/不干胶/冻炒米", "total_price": 28.9}, {"num": 2000, "spec": "一张", "price": 0.181, "unit_id": 0, "goods_id": 984, "goods_sn": "SP0000050", "unit_name": "3009", "goods_name": "茶包/类腰封纸", "total_price": 362}, {"num": 500, "spec": "1", "price": 0.0816, "unit_id": 0, "goods_id": 975, "goods_sn": "SP0000059", "unit_name": "张", "goods_name": "黄油脖签", "total_price": 40.8}, {"num": 3000, "spec": "1", "price": 0.05433, "unit_id": 0, "goods_id": 978, "goods_sn": "SP0000056", "unit_name": "张", "goods_name": "新茶专用标签纸", "total_price": 162.99}]	从saas.mzth.cn导入 原单号:CG0002609	0	0		2026-03-31 15:29:52.954486	\N
161	CGRK202603314637	268	93	杂/采购商	牧区纯坊官方品牌	2025-12-10	[{"num": 6, "spec": "400克", "price": 3.5, "unit_id": 0, "goods_id": 929, "goods_sn": "SP0000106", "unit_name": "袋", "goods_name": "白砂糖", "total_price": 21}]	从saas.mzth.cn导入 原单号:CG0002994	0	0		2026-03-31 15:28:06.654772	\N
163	CGRK202603315061	432	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-09	[{"num": 1, "spec": "1斤散称", "price": 10, "unit_id": 0, "goods_id": 922, "goods_sn": "SP0000113", "unit_name": "麻袋", "goods_name": "酸奶炒米糖/散装", "total_price": 10}, {"num": 1, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "麻袋", "goods_name": "嚼口脆炒米糖/散装", "total_price": 15}]	从saas.mzth.cn导入 原单号:CG0002913	0	0		2026-03-31 15:28:11.994894	\N
166	CGRK202603318149	278	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-09	[{"num": 1, "spec": "1斤散称", "price": 10, "unit_id": 0, "goods_id": 922, "goods_sn": "SP0000113", "unit_name": "麻袋", "goods_name": "酸奶炒米糖/散装", "total_price": 10}, {"num": 1, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "麻袋", "goods_name": "嚼口脆炒米糖/散装", "total_price": 15}]	从saas.mzth.cn导入 原单号:CG0002913	0	0		2026-03-31 15:28:20.846018	\N
201	CGRK202603314460	454	106	拼多多/热缩膜	牧区纯坊官方品牌	2025-11-16	[{"num": 2600, "spec": "0", "price": 0.09442, "unit_id": 0, "goods_id": 995, "goods_sn": "SP0000039", "unit_name": "袋", "goods_name": "茶专用/热缩膜", "total_price": 245.49}]	从saas.mzth.cn导入 原单号:CG0002606	0	0		2026-03-31 15:29:42.214439	\N
203	CGRK202603317776	452	101	拼多多/随机店采购	牧区纯坊官方品牌	2025-11-16	[{"num": 1, "spec": "1", "price": 2800, "unit_id": 0, "goods_id": 1001, "goods_sn": "SP0000033", "unit_name": "台", "goods_name": "冷冻柜/冰箱", "total_price": 2800}]	从saas.mzth.cn导入 原单号:CG0002608	0	0		2026-03-31 15:29:46.369298	\N
205	CGRK202603311075	450	100	民族印刷厂	牧区纯坊官方品牌	2025-11-16	[{"num": 25, "spec": "1", "price": 0.72, "unit_id": 0, "goods_id": 983, "goods_sn": "SP0000051", "unit_name": "张", "goods_name": "甜味/标签/不干胶/传统奶豆腐", "total_price": 18}, {"num": 25, "spec": "1", "price": 0.72, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 18}, {"num": 60, "spec": "0", "price": 1, "unit_id": 0, "goods_id": 999, "goods_sn": "SP0000035", "unit_name": "张", "goods_name": "茶专用/不干胶/标签", "total_price": 60}]	从saas.mzth.cn导入 原单号:CG0002610	0	0		2026-03-31 15:29:50.791389	\N
209	CGRK202603312404	460	108	山东锦食食品	牧区纯坊官方品牌	2025-11-01	[{"num": 8, "spec": "2g", "price": 68.75, "unit_id": 0, "goods_id": 997, "goods_sn": "SP0000037", "unit_name": "件", "goods_name": "茶专用/盐包", "total_price": 550}]	从saas.mzth.cn导入 原单号:CG0002418	0	0		2026-03-31 15:29:59.426722	\N
181	CGRK202603312723	444	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-04	[{"num": 7, "spec": "斤/两盒", "price": 22, "unit_id": 0, "goods_id": 981, "goods_sn": "SP0000053", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 154}]	从saas.mzth.cn导入 原单号:CG0002847	0	0		2026-03-31 15:28:56.470846	\N
177	CGRK202603316103	284	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2025-12-05	[{"num": 40, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_sn": "SP0000021", "unit_name": "盒", "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 220}]	从saas.mzth.cn导入 原单号:CG0002857	0	0		2026-03-31 15:28:46.60166	\N
179	CGRK202603314923	282	93	杂/采购商	牧区纯坊官方品牌	2025-12-05	[{"num": 2, "spec": "400克", "price": 3.5, "unit_id": 0, "goods_id": 929, "goods_sn": "SP0000106", "unit_name": "袋", "goods_name": "白砂糖", "total_price": 7}, {"num": 1, "spec": "1", "price": 90, "unit_id": 0, "goods_id": 1002, "goods_sn": "SP0000032", "unit_name": "台", "goods_name": "封口机/真空", "total_price": 90}, {"num": 300, "spec": "大/中/小", "price": 0.03333, "unit_id": 0, "goods_id": 928, "goods_sn": "SP0000107", "unit_name": "袋", "goods_name": "塑料购物袋", "total_price": 10}]	从saas.mzth.cn导入 原单号:CG0002864	0	0		2026-03-31 15:28:52.145481	\N
184	CGRK202603312482	441	121	盛大印刷	牧区纯坊官方品牌	2025-12-04	[{"num": 20000, "spec": "1", "price": 0.0265, "unit_id": 0, "goods_id": 979, "goods_sn": "SP0000055", "unit_name": "张", "goods_name": "新茶包/纸", "total_price": 530}, {"num": 500, "spec": "1", "price": 0.0682, "unit_id": 0, "goods_id": 1020, "goods_sn": "SP0000014", "unit_name": "张", "goods_name": "标签/不干胶/奶果子", "total_price": 34.1}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 950, "goods_sn": "SP0000085", "unit_name": "张", "goods_name": "透专标签/奶皮卷", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 951, "goods_sn": "SP0000084", "unit_name": "张", "goods_name": "透专标签/冻炒米", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 952, "goods_sn": "SP0000083", "unit_name": "张", "goods_name": "透专标签/奶酪/原味", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 953, "goods_sn": "SP0000082", "unit_name": "张", "goods_name": "透专标签/奶酪/甜味", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 954, "goods_sn": "SP0000081", "unit_name": "张", "goods_name": "透专标签/乳清奶条/甜味", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 955, "goods_sn": "SP0000080", "unit_name": "张", "goods_name": "透专标签/乳清奶条/原味", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 956, "goods_sn": "SP0000079", "unit_name": "张", "goods_name": "透专标签/鲜奶皮", "total_price": 25.69}]	从saas.mzth.cn导入 原单号:CG0002855	0	0		2026-03-31 15:29:03.075054	\N
186	CGRK202603318332	288	97	纯净奶食品	牧区纯坊官方品牌	2025-12-04	[{"num": 20, "spec": "150克", "price": 14.5, "unit_id": 0, "goods_id": 973, "goods_sn": "SP0000061", "unit_name": "袋", "goods_name": "精品/奶豆腐块儿/甜味/", "total_price": 290}, {"num": 20, "spec": "150克", "price": 14.5, "unit_id": 0, "goods_id": 986, "goods_sn": "SP0000048", "unit_name": "袋", "goods_name": "精品/奶豆腐块儿/原味", "total_price": 290}, {"num": 32, "spec": "1", "price": 6, "unit_id": 0, "goods_id": 974, "goods_sn": "SP0000060", "unit_name": "瓶", "goods_name": "纯净黄油/瓶装好的", "total_price": 192}]	从saas.mzth.cn导入 原单号:CG0002852	0	0		2026-03-31 15:29:07.34269	\N
188	CGRK202603319374	286	121	盛大印刷	牧区纯坊官方品牌	2025-12-04	[{"num": 20000, "spec": "1", "price": 0.0265, "unit_id": 0, "goods_id": 979, "goods_sn": "SP0000055", "unit_name": "张", "goods_name": "新茶包/纸", "total_price": 530}, {"num": 500, "spec": "1", "price": 0.0682, "unit_id": 0, "goods_id": 1020, "goods_sn": "SP0000014", "unit_name": "张", "goods_name": "标签/不干胶/奶果子", "total_price": 34.1}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 950, "goods_sn": "SP0000085", "unit_name": "张", "goods_name": "透专标签/奶皮卷", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 951, "goods_sn": "SP0000084", "unit_name": "张", "goods_name": "透专标签/冻炒米", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 952, "goods_sn": "SP0000083", "unit_name": "张", "goods_name": "透专标签/奶酪/原味", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 953, "goods_sn": "SP0000082", "unit_name": "张", "goods_name": "透专标签/奶酪/甜味", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 954, "goods_sn": "SP0000081", "unit_name": "张", "goods_name": "透专标签/乳清奶条/甜味", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 955, "goods_sn": "SP0000080", "unit_name": "张", "goods_name": "透专标签/乳清奶条/原味", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 956, "goods_sn": "SP0000079", "unit_name": "张", "goods_name": "透专标签/鲜奶皮", "total_price": 25.69}]	从saas.mzth.cn导入 原单号:CG0002855	0	0		2026-03-31 15:29:12.004861	\N
190	CGRK202603317488	289	97	纯净奶食品	牧区纯坊官方品牌	2025-12-03	[{"num": 10, "spec": "45散称/斤/9元/100克", "price": 45, "unit_id": 0, "goods_id": 972, "goods_sn": "SP0000062", "unit_name": "斤", "goods_name": "原味/散称/奶豆腐块儿", "total_price": 450}, {"num": 10, "spec": "45散称/斤/9元/100克", "price": 45, "unit_id": 0, "goods_id": 971, "goods_sn": "SP0000063", "unit_name": "斤", "goods_name": "甜味/散称/奶豆腐块儿", "total_price": 450}, {"num": 38, "spec": "140克", "price": 4.2, "unit_id": 0, "goods_id": 965, "goods_sn": "SP0000069", "unit_name": "盒", "goods_name": "半成品/透明/冻炒米", "total_price": 159.6}, {"num": 50, "spec": "200克", "price": 10, "unit_id": 0, "goods_id": 970, "goods_sn": "SP0000064", "unit_name": "盒", "goods_name": "热奶豆腐碗", "total_price": 500}, {"num": 30, "spec": "150-180克", "price": 13, "unit_id": 0, "goods_id": 968, "goods_sn": "SP0000066", "unit_name": "张", "goods_name": "大/奶皮", "total_price": 390}, {"num": 30, "spec": "120-150克", "price": 10, "unit_id": 0, "goods_id": 969, "goods_sn": "SP0000065", "unit_name": "张", "goods_name": "小/奶皮", "total_price": 300}, {"num": 5, "spec": "4斤装", "price": 4, "unit_id": 0, "goods_id": 967, "goods_sn": "SP0000067", "unit_name": "桶", "goods_name": "查嘎/乳清", "total_price": 20}, {"num": 30, "spec": "50克", "price": 3, "unit_id": 0, "goods_id": 966, "goods_sn": "SP0000068", "unit_name": "小包", "goods_name": "查嘎粉/小包装袋", "total_price": 90}]	从saas.mzth.cn导入 原单号:CG0002851	0	0		2026-03-31 15:29:16.340781	\N
116	CGRK202603313660	409	97	纯净奶食品	牧区纯坊官方品牌	2025-12-25	[{"num": 40, "spec": "180克", "price": 14, "unit_id": 0, "goods_id": 946, "goods_sn": "SP0000089", "unit_name": "盒", "goods_name": "半成品/透明/鲜奶皮", "total_price": 560}, {"num": 50, "spec": "180克", "price": 13, "unit_id": 0, "goods_id": 945, "goods_sn": "SP0000090", "unit_name": "盒", "goods_name": "半成品/透明/奶皮卷", "total_price": 650}, {"num": 20, "spec": "150克", "price": 12, "unit_id": 0, "goods_id": 944, "goods_sn": "SP0000091", "unit_name": "盒", "goods_name": "半成品/透明/奶皮千层", "total_price": 240}, {"num": 35, "spec": "1", "price": 6, "unit_id": 0, "goods_id": 974, "goods_sn": "SP0000060", "unit_name": "瓶", "goods_name": "纯净黄油/瓶装好的", "total_price": 210}, {"num": 10, "spec": "1斤装", "price": 22, "unit_id": 0, "goods_id": 899, "goods_sn": "SP0000136", "unit_name": "瓶", "goods_name": "纯净/黄油/斤", "total_price": 220}, {"num": 4, "spec": "斤", "price": 10, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 40}, {"num": 30, "spec": "150-180克", "price": 13, "unit_id": 0, "goods_id": 968, "goods_sn": "SP0000066", "unit_name": "张", "goods_name": "大/奶皮", "total_price": 390}]	从saas.mzth.cn导入 原单号:CG0003286	0	0		2026-03-31 15:26:20.205342	\N
185	CGRK202603317710	290	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-04	[{"num": 7, "spec": "斤/两盒", "price": 22, "unit_id": 0, "goods_id": 981, "goods_sn": "SP0000053", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 154}]	从saas.mzth.cn导入 原单号:CG0002847	0	0		2026-03-31 15:29:05.423868	\N
144	CGRK202603315838	422	92	奥都奶食品	牧区纯坊官方品牌	2025-12-13	[{"num": 10, "spec": "斤", "price": 8, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 80}, {"num": 4, "spec": "斤", "price": 12, "unit_id": 0, "goods_id": 917, "goods_sn": "SP0000118", "unit_name": "斤", "goods_name": "机器乌日末液体", "total_price": 48}]	从saas.mzth.cn导入 原单号:CG0003007	0	0		2026-03-31 15:27:22.636597	\N
168	CGRK202603312165	435	92	奥都奶食品	牧区纯坊官方品牌	2025-12-07	[{"num": 5, "spec": "300克", "price": 8, "unit_id": 0, "goods_id": 924, "goods_sn": "SP0000111", "unit_name": "袋", "goods_name": "冻炒米/袋装", "total_price": 40}, {"num": 2, "spec": "斤", "price": 9, "unit_id": 0, "goods_id": 917, "goods_sn": "SP0000118", "unit_name": "斤", "goods_name": "机器乌日末液体", "total_price": 18}, {"num": 10, "spec": "斤", "price": 8, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 80}, {"num": 2, "spec": "半斤装", "price": 11, "unit_id": 0, "goods_id": 918, "goods_sn": "SP0000117", "unit_name": "瓶", "goods_name": "黄油/半斤", "total_price": 22}, {"num": 4, "spec": "400克", "price": 20, "unit_id": 0, "goods_id": 919, "goods_sn": "SP0000116", "unit_name": "瓶", "goods_name": "黄油/斤", "total_price": 80}]	从saas.mzth.cn导入 原单号:CG0002900	0	0		2026-03-31 15:28:25.578173	\N
202	CGRK202603312389	453	101	拼多多/随机店采购	牧区纯坊官方品牌	2025-11-16	[{"num": 1, "spec": "1", "price": 38, "unit_id": 0, "goods_id": 1002, "goods_sn": "SP0000032", "unit_name": "台", "goods_name": "封口机/真空", "total_price": 38}]	从saas.mzth.cn导入 原单号:CG0002607	0	0		2026-03-31 15:29:44.145373	\N
135	CGRK202603314619	260	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-17	[{"num": 20, "spec": "半斤", "price": 14, "unit_id": 0, "goods_id": 916, "goods_sn": "SP0000119", "unit_name": "斤", "goods_name": "脆奶条/散装/科尔沁", "total_price": 280}, {"num": 7, "spec": "1盒", "price": 15, "unit_id": 0, "goods_id": 889, "goods_sn": "SP0000146", "unit_name": "盒", "goods_name": "奶皮卷/科尔沁", "total_price": 105}, {"num": 2, "spec": "1", "price": 7, "unit_id": 0, "goods_id": 886, "goods_sn": "SP0000149", "unit_name": "盒", "goods_name": "冻炒米/科尔沁", "total_price": 14}, {"num": 4, "spec": "320克", "price": 25, "unit_id": 0, "goods_id": 887, "goods_sn": "SP0000148", "unit_name": "盒", "goods_name": "羊乳奶粉/奶茶专用", "total_price": 100}, {"num": 4, "spec": "320克", "price": 14, "unit_id": 0, "goods_id": 888, "goods_sn": "SP0000147", "unit_name": "盒", "goods_name": "河套奶粉", "total_price": 56}]	从saas.mzth.cn导入 原单号:CG0003078	0	0		2026-03-31 15:27:03.09663	\N
204	CGRK202603318283	451	121	盛大印刷	牧区纯坊官方品牌	2025-11-16	[{"num": 500, "spec": "1", "price": 0.0578, "unit_id": 0, "goods_id": 1019, "goods_sn": "SP0000015", "unit_name": "张", "goods_name": "标签/不干胶/冻炒米", "total_price": 28.9}, {"num": 2000, "spec": "一张", "price": 0.181, "unit_id": 0, "goods_id": 984, "goods_sn": "SP0000050", "unit_name": "3009", "goods_name": "茶包/类腰封纸", "total_price": 362}, {"num": 500, "spec": "1", "price": 0.0816, "unit_id": 0, "goods_id": 975, "goods_sn": "SP0000059", "unit_name": "张", "goods_name": "黄油脖签", "total_price": 40.8}, {"num": 3000, "spec": "1", "price": 0.05433, "unit_id": 0, "goods_id": 978, "goods_sn": "SP0000056", "unit_name": "张", "goods_name": "新茶专用标签纸", "total_price": 162.99}]	从saas.mzth.cn导入 原单号:CG0002609	0	0		2026-03-31 15:29:48.497461	\N
191	CGRK202603316912	448	99	淘宝/杂	牧区纯坊官方品牌	2025-12-01	[{"num": 5000, "spec": "1", "price": 0.185, "unit_id": 0, "goods_id": 982, "goods_sn": "SP0000052", "unit_name": "个", "goods_name": "塑料手提袋", "total_price": 925}]	从saas.mzth.cn导入 原单号:CG0002794	0	0		2026-03-31 15:29:18.551096	\N
200	CGRK202603317084	455	107	拼多多/木勺	牧区纯坊官方品牌	2025-11-16	[{"num": 10, "spec": "袋100个/平均价0.1599", "price": 15.99, "unit_id": 0, "goods_id": 1000, "goods_sn": "SP0000034", "unit_name": "捆", "goods_name": "木勺", "total_price": 159.9}]	从saas.mzth.cn导入 原单号:CG0002605	0	0		2026-03-31 15:29:39.98682	\N
175	CGRK202603313193	436	97	纯净奶食品	牧区纯坊官方品牌	2025-12-05	[{"num": 19, "spec": "1斤2两", "price": 25, "unit_id": 0, "goods_id": 926, "goods_sn": "SP0000109", "unit_name": "个", "goods_name": "大奶豆腐砖/1.2斤", "total_price": 475}, {"num": 20, "spec": "1斤", "price": 20, "unit_id": 0, "goods_id": 927, "goods_sn": "SP0000108", "unit_name": "个", "goods_name": "小奶豆腐砖/1斤", "total_price": 400}, {"num": 20, "spec": "1斤", "price": 20, "unit_id": 0, "goods_id": 925, "goods_sn": "SP0000110", "unit_name": "个", "goods_name": "小/无印花/奶豆腐砖/1斤", "total_price": 400}, {"num": 29, "spec": "180克", "price": 14, "unit_id": 0, "goods_id": 946, "goods_sn": "SP0000089", "unit_name": "盒", "goods_name": "半成品/透明/鲜奶皮", "total_price": 406}, {"num": 6, "spec": "180克", "price": 14, "unit_id": 0, "goods_id": 945, "goods_sn": "SP0000090", "unit_name": "盒", "goods_name": "半成品/透明/奶皮卷", "total_price": 84}, {"num": 40, "spec": "200克", "price": 13, "unit_id": 0, "goods_id": 939, "goods_sn": "SP0000096", "unit_name": "盒", "goods_name": "半成品/透明/原味/鲜奶酪", "total_price": 520}, {"num": 40, "spec": "200克", "price": 13, "unit_id": 0, "goods_id": 940, "goods_sn": "SP0000095", "unit_name": "盒", "goods_name": "半成品/透明/甜味/鲜奶酪", "total_price": 520}]	从saas.mzth.cn导入 原单号:CG0002866	0	0		2026-03-31 15:28:42.00822	\N
189	CGRK202603318436	445	97	纯净奶食品	牧区纯坊官方品牌	2025-12-03	[{"num": 10, "spec": "45散称/斤/9元/100克", "price": 45, "unit_id": 0, "goods_id": 972, "goods_sn": "SP0000062", "unit_name": "斤", "goods_name": "原味/散称/奶豆腐块儿", "total_price": 450}, {"num": 10, "spec": "45散称/斤/9元/100克", "price": 45, "unit_id": 0, "goods_id": 971, "goods_sn": "SP0000063", "unit_name": "斤", "goods_name": "甜味/散称/奶豆腐块儿", "total_price": 450}, {"num": 38, "spec": "140克", "price": 4.2, "unit_id": 0, "goods_id": 965, "goods_sn": "SP0000069", "unit_name": "盒", "goods_name": "半成品/透明/冻炒米", "total_price": 159.6}, {"num": 50, "spec": "200克", "price": 10, "unit_id": 0, "goods_id": 970, "goods_sn": "SP0000064", "unit_name": "盒", "goods_name": "热奶豆腐碗", "total_price": 500}, {"num": 30, "spec": "150-180克", "price": 13, "unit_id": 0, "goods_id": 968, "goods_sn": "SP0000066", "unit_name": "张", "goods_name": "大/奶皮", "total_price": 390}, {"num": 30, "spec": "120-150克", "price": 10, "unit_id": 0, "goods_id": 969, "goods_sn": "SP0000065", "unit_name": "张", "goods_name": "小/奶皮", "total_price": 300}, {"num": 5, "spec": "4斤装", "price": 4, "unit_id": 0, "goods_id": 967, "goods_sn": "SP0000067", "unit_name": "桶", "goods_name": "查嘎/乳清", "total_price": 20}, {"num": 30, "spec": "50克", "price": 3, "unit_id": 0, "goods_id": 966, "goods_sn": "SP0000068", "unit_name": "小包", "goods_name": "查嘎粉/小包装袋", "total_price": 90}]	从saas.mzth.cn导入 原单号:CG0002851	0	0		2026-03-31 15:29:14.187949	\N
192	CGRK202603312940	447	118	淘宝/江苏永发玻璃制品厂	牧区纯坊官方品牌	2025-12-01	[{"num": 240, "spec": "100ML", "price": 1.8, "unit_id": 0, "goods_id": 1016, "goods_sn": "SP0000018", "unit_name": "瓶", "goods_name": "专瓶/黄油", "total_price": 432}, {"num": 120, "spec": "120mL", "price": 1.8, "unit_id": 0, "goods_id": 862, "goods_sn": "SP0000173", "unit_name": "瓶", "goods_name": "专瓶/黄油渣", "total_price": 216}]	从saas.mzth.cn导入 原单号:CG0002797	0	0		2026-03-31 15:29:21.22536	\N
193	CGRK202603313044	446	120	淘宝紫辰包装	牧区纯坊官方品牌	2025-12-01	[{"num": 500, "spec": "1", "price": 0.1408, "unit_id": 0, "goods_id": 1027, "goods_sn": "SP0000007", "unit_name": "张", "goods_name": "真空袋", "total_price": 70.4}]	从saas.mzth.cn导入 原单号:CG0002801	0	0		2026-03-31 15:29:23.89839	\N
194	CGRK202603317738	294	99	淘宝/杂	牧区纯坊官方品牌	2025-12-01	[{"num": 5000, "spec": "1", "price": 0.185, "unit_id": 0, "goods_id": 982, "goods_sn": "SP0000052", "unit_name": "个", "goods_name": "塑料手提袋", "total_price": 925}]	从saas.mzth.cn导入 原单号:CG0002794	0	0		2026-03-31 15:29:26.096055	\N
195	CGRK202603312017	293	118	淘宝/江苏永发玻璃制品厂	牧区纯坊官方品牌	2025-12-01	[{"num": 240, "spec": "100ML", "price": 1.8, "unit_id": 0, "goods_id": 1016, "goods_sn": "SP0000018", "unit_name": "瓶", "goods_name": "专瓶/黄油", "total_price": 432}, {"num": 120, "spec": "120mL", "price": 1.8, "unit_id": 0, "goods_id": 862, "goods_sn": "SP0000173", "unit_name": "瓶", "goods_name": "专瓶/黄油渣", "total_price": 216}]	从saas.mzth.cn导入 原单号:CG0002797	0	0		2026-03-31 15:29:28.318739	\N
196	CGRK202603312344	291	120	淘宝紫辰包装	牧区纯坊官方品牌	2025-12-01	[{"num": 500, "spec": "1", "price": 0.1408, "unit_id": 0, "goods_id": 1027, "goods_sn": "SP0000007", "unit_name": "张", "goods_name": "真空袋", "total_price": 70.4}]	从saas.mzth.cn导入 原单号:CG0002801	0	0		2026-03-31 15:29:30.341194	\N
197	CGRK202603315015	449	105	翁牛特旗奶果子	牧区纯坊官方品牌	2025-11-30	[{"num": 85.84, "spec": "平均一块儿", "price": 25, "unit_id": 0, "goods_id": 991, "goods_sn": "SP0000043", "unit_name": "斤", "goods_name": "奶果子/散装", "total_price": 2146}]	从saas.mzth.cn导入 原单号:CG0002800	0	0		2026-03-31 15:29:32.941443	\N
198	CGRK202603313831	292	105	翁牛特旗奶果子	牧区纯坊官方品牌	2025-11-30	[{"num": 85.84, "spec": "平均一块儿", "price": 25, "unit_id": 0, "goods_id": 991, "goods_sn": "SP0000043", "unit_name": "斤", "goods_name": "奶果子/散装", "total_price": 2146}]	从saas.mzth.cn导入 原单号:CG0002800	0	0		2026-03-31 15:29:35.060362	\N
199	CGRK202603317227	456	117	巴音珠萨朗	牧区纯坊官方品牌	2025-11-16	[{"num": 21, "spec": "250克/一袋", "price": 17, "unit_id": 0, "goods_id": 1014, "goods_sn": "SP0000020", "unit_name": "斤", "goods_name": "散装/甜味奶条", "total_price": 357}]	从saas.mzth.cn导入 原单号:CG0002604	0	0		2026-03-31 15:29:37.807627	\N
211	CGRK202603319814	458	108	山东锦食食品	牧区纯坊官方品牌	2025-11-01	[{"num": 3560, "spec": "2g", "price": 0.068, "unit_id": 0, "goods_id": 997, "goods_sn": "SP0000037", "unit_name": "小包", "goods_name": "茶专用/盐包", "total_price": 242.08}]	从saas.mzth.cn导入 原单号:CG0002475	0	0		2026-03-31 15:30:04.3374	\N
213	CGRK202603315724	463	112	广州维记	牧区纯坊官方品牌	2025-10-26	[{"num": 10, "spec": "400/箱/0.423/球", "price": 182, "unit_id": 0, "goods_id": 1010, "goods_sn": "SP0000024", "unit_name": "件", "goods_name": "奶油球", "total_price": 1820}]	从saas.mzth.cn导入 原单号:CG0002219	0	0		2026-03-31 15:30:08.978301	\N
216	CGRK202603314584	466	116	恩赫奶制品厂	牧区纯坊官方品牌	2025-10-20	[{"num": 15.8, "spec": "250克/一袋", "price": 18, "unit_id": 0, "goods_id": 1015, "goods_sn": "SP0000019", "unit_name": "斤", "goods_name": "散装/原味奶条", "total_price": 284.4}]	从saas.mzth.cn导入 原单号:CG0002417	0	0		2026-03-31 15:30:15.673909	\N
246	CGRK202603319888	488	123	银河包装	牧区纯坊官方品牌	2025-09-30	[{"num": 368, "spec": "1", "price": 0.94, "unit_id": 0, "goods_id": 1017, "goods_sn": "SP0000017", "unit_name": "张", "goods_name": "手提袋", "total_price": 345.92}, {"num": 80, "spec": "1", "price": 35.5, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "捆", "goods_name": "专袋/奶条", "total_price": 2840}, {"num": 20, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 14.2}, {"num": 86, "spec": "1", "price": 35.5, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "捆", "goods_name": "专袋/奶条", "total_price": 3053}, {"num": 5, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 3.55}, {"num": 17, "spec": "1", "price": 18.5, "unit_id": 0, "goods_id": 1031, "goods_sn": "SP0000003", "unit_name": "捆", "goods_name": "专底盒/奶条", "total_price": 314.5}, {"num": 24, "spec": "1", "price": 0.37, "unit_id": 0, "goods_id": 1031, "goods_sn": "SP0000003", "unit_name": "张", "goods_name": "专底盒/奶条", "total_price": 8.88}]	从saas.mzth.cn导入 原单号:CG0002014	0	0		2026-03-31 15:31:25.129598	\N
182	CGRK202603316782	443	97	纯净奶食品	牧区纯坊官方品牌	2025-12-04	[{"num": 20, "spec": "150克", "price": 14.5, "unit_id": 0, "goods_id": 973, "goods_sn": "SP0000061", "unit_name": "袋", "goods_name": "精品/奶豆腐块儿/甜味/", "total_price": 290}, {"num": 20, "spec": "150克", "price": 14.5, "unit_id": 0, "goods_id": 986, "goods_sn": "SP0000048", "unit_name": "袋", "goods_name": "精品/奶豆腐块儿/原味", "total_price": 290}, {"num": 32, "spec": "1", "price": 6, "unit_id": 0, "goods_id": 974, "goods_sn": "SP0000060", "unit_name": "瓶", "goods_name": "纯净黄油/瓶装好的", "total_price": 192}]	从saas.mzth.cn导入 原单号:CG0002852	0	0		2026-03-31 15:28:58.63889	\N
207	CGRK202603313456	295	100	民族印刷厂	牧区纯坊官方品牌	2025-11-16	[{"num": 25, "spec": "1", "price": 0.72, "unit_id": 0, "goods_id": 983, "goods_sn": "SP0000051", "unit_name": "张", "goods_name": "甜味/标签/不干胶/传统奶豆腐", "total_price": 18}, {"num": 25, "spec": "1", "price": 0.72, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 18}, {"num": 60, "spec": "0", "price": 1, "unit_id": 0, "goods_id": 999, "goods_sn": "SP0000035", "unit_name": "张", "goods_name": "茶专用/不干胶/标签", "total_price": 60}]	从saas.mzth.cn导入 原单号:CG0002610	0	0		2026-03-31 15:29:55.116217	\N
208	CGRK202603314211	457	112	广州维记	牧区纯坊官方品牌	2025-11-07	[{"num": 10, "spec": "400/箱/0.423/球", "price": 181.7, "unit_id": 0, "goods_id": 1010, "goods_sn": "SP0000024", "unit_name": "件", "goods_name": "奶油球", "total_price": 1817}]	从saas.mzth.cn导入 原单号:CG0002603	0	0		2026-03-31 15:29:57.243263	\N
214	CGRK202603312742	462	104	锡盟艾润萨利SC	牧区纯坊官方品牌	2025-10-26	[{"num": 14, "spec": "不定具体产品", "price": 33.57143, "unit_id": 0, "goods_id": 987, "goods_sn": "SP0000047", "unit_name": "斤", "goods_name": "采购样品专用/乳制品", "total_price": 470}]	从saas.mzth.cn导入 原单号:CG0002220	0	0		2026-03-31 15:30:11.204431	\N
215	CGRK202603313416	464	110	淘宝欧信	牧区纯坊官方品牌	2025-10-22	[{"num": 1, "spec": "1", "price": 1700, "unit_id": 0, "goods_id": 1003, "goods_sn": "SP0000031", "unit_name": "台", "goods_name": "热收缩膜机", "total_price": 1700}]	从saas.mzth.cn导入 原单号:CG0002151	0	0		2026-03-31 15:30:13.408583	\N
217	CGRK202603312582	465	116	恩赫奶制品厂	牧区纯坊官方品牌	2025-10-20	[{"num": 9.2, "spec": "250克/一袋", "price": 9, "unit_id": 0, "goods_id": 1015, "goods_sn": "SP0000019", "unit_name": "斤", "goods_name": "散装/原味奶条", "total_price": 82.8}]	从saas.mzth.cn导入 原单号:CG0002951	0	0		2026-03-31 15:30:17.819934	\N
218	CGRK202603314191	275	116	恩赫奶制品厂	牧区纯坊官方品牌	2025-10-20	[{"num": 9.2, "spec": "250克/一袋", "price": 9, "unit_id": 0, "goods_id": 1015, "goods_sn": "SP0000019", "unit_name": "斤", "goods_name": "散装/原味奶条", "total_price": 82.8}]	从saas.mzth.cn导入 原单号:CG0002951	0	0		2026-03-31 15:30:19.947968	\N
222	CGRK202603315894	470	116	恩赫奶制品厂	牧区纯坊官方品牌	2025-10-10	[{"num": 15, "spec": "250克/一袋", "price": 18, "unit_id": 0, "goods_id": 1015, "goods_sn": "SP0000019", "unit_name": "斤", "goods_name": "散装/原味奶条", "total_price": 270}]	从saas.mzth.cn导入 原单号:CG0002022	0	0		2026-03-31 15:30:29.20506	\N
223	CGRK202603316571	471	112	广州维记	牧区纯坊官方品牌	2025-10-09	[{"num": 8, "spec": "400/箱/0.423/球", "price": 181.875, "unit_id": 0, "goods_id": 1010, "goods_sn": "SP0000024", "unit_name": "件", "goods_name": "奶油球", "total_price": 1455}]	从saas.mzth.cn导入 原单号:CG0002027	0	0		2026-03-31 15:30:31.366237	\N
224	CGRK202603311827	472	113	永巨茶业	牧区纯坊官方品牌	2025-10-06	[{"num": 8, "spec": "1件2000包/300元/1件", "price": 353.13, "unit_id": 0, "goods_id": 1011, "goods_sn": "SP0000023", "unit_name": "件", "goods_name": "茶包", "total_price": 2825.04}]	从saas.mzth.cn导入 原单号:CG0002026	0	0		2026-03-31 15:30:33.702678	\N
225	CGRK202603314744	481	108	山东锦食食品	牧区纯坊官方品牌	2025-10-01	[{"num": 2, "spec": "2g", "price": 68.75, "unit_id": 0, "goods_id": 997, "goods_sn": "SP0000037", "unit_name": "件", "goods_name": "茶专用/盐包", "total_price": 137.5}, {"num": 200, "spec": "2g", "price": 0.068, "unit_id": 0, "goods_id": 997, "goods_sn": "SP0000037", "unit_name": "小包", "goods_name": "茶专用/盐包", "total_price": 13.6}]	从saas.mzth.cn导入 原单号:CG0002152	0	0		2026-03-31 15:30:36.489877	\N
226	CGRK202603317862	480	107	拼多多/木勺	牧区纯坊官方品牌	2025-10-01	[{"num": 2, "spec": "袋100个/平均价0.1599", "price": 15.99, "unit_id": 0, "goods_id": 1000, "goods_sn": "SP0000034", "unit_name": "捆", "goods_name": "木勺", "total_price": 31.98}, {"num": 200, "spec": "袋100个/平均价0.1599", "price": 0.1599, "unit_id": 0, "goods_id": 1000, "goods_sn": "SP0000034", "unit_name": "个", "goods_name": "木勺", "total_price": 31.98}]	从saas.mzth.cn导入 原单号:CG0002153	0	0		2026-03-31 15:30:38.73637	\N
228	CGRK202603312868	478	106	拼多多/热缩膜	牧区纯坊官方品牌	2025-10-01	[{"num": 10, "spec": "0", "price": 10, "unit_id": 0, "goods_id": 995, "goods_sn": "SP0000039", "unit_name": "捆", "goods_name": "茶专用/热缩膜", "total_price": 100}]	从saas.mzth.cn导入 原单号:CG0002173	0	0		2026-03-31 15:30:43.548479	\N
237	CGRK202603316109	497	120	淘宝紫辰包装	牧区纯坊官方品牌	2025-09-30	[{"num": 60, "spec": "1", "price": 0.17, "unit_id": 0, "goods_id": 1027, "goods_sn": "SP0000007", "unit_name": "张", "goods_name": "真空袋", "total_price": 10.2}]	从saas.mzth.cn导入 原单号:CG0002005	0	0		2026-03-31 15:31:04.791155	\N
219	CGRK202603317649	468	117	巴音珠萨朗	牧区纯坊官方品牌	2025-10-12	[{"num": 16.41, "spec": "250克/一袋", "price": 16, "unit_id": 0, "goods_id": 1014, "goods_sn": "SP0000020", "unit_name": "斤", "goods_name": "散装/甜味奶条", "total_price": 262.56}, {"num": 10, "spec": "250克/一袋", "price": 16, "unit_id": 0, "goods_id": 1014, "goods_sn": "SP0000020", "unit_name": "斤", "goods_name": "散装/甜味奶条", "total_price": 160}]	从saas.mzth.cn导入 原单号:CG0002021	0	0		2026-03-31 15:30:22.215767	\N
212	CGRK202603315166	461	114	阿旗北方	牧区纯坊官方品牌	2025-10-31	[{"num": 3, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_sn": "SP0000021", "unit_name": "盒", "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 16.5}]	从saas.mzth.cn导入 原单号:CG0002415	0	0		2026-03-31 15:30:06.651148	\N
220	CGRK202603311843	467	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2025-10-12	[{"num": 30, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_sn": "SP0000021", "unit_name": "盒", "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 165}]	从saas.mzth.cn导入 原单号:CG0002023	0	0		2026-03-31 15:30:24.36297	\N
221	CGRK202603317409	469	111	优如包装	牧区纯坊官方品牌	2025-10-11	[{"num": 3030, "spec": "1", "price": 2.47525, "unit_id": 0, "goods_id": 1009, "goods_sn": "SP0000025", "unit_name": "张", "goods_name": "专盒/青砖奶茶外盒", "total_price": 7500.01}]	从saas.mzth.cn导入 原单号:CG0002028	0	0		2026-03-31 15:30:26.55265	\N
183	CGRK202603316560	442	96	浙江金矿包装	牧区纯坊官方品牌	2025-12-04	[{"num": 240, "spec": "7.4X7.4X7.8 奶豆腐/冻炒米通用", "price": 0.8, "unit_id": 0, "goods_id": 963, "goods_sn": "SP0000071", "unit_name": "盒", "goods_name": "小/方形/亚克力盒/", "total_price": 192}, {"num": 258, "spec": "85X85X63 鲜奶皮", "price": 0.85, "unit_id": 0, "goods_id": 962, "goods_sn": "SP0000072", "unit_name": "盒", "goods_name": "中/方形/亚克力盒/", "total_price": 219.3}, {"num": 200, "spec": "31g", "price": 0.85, "unit_id": 0, "goods_id": 960, "goods_sn": "SP0000075", "unit_name": "盒", "goods_name": "三角/奶皮千层盒", "total_price": 170}, {"num": 300, "spec": "182X120X28/烤奶豆腐片/奶皮卷", "price": 1.75, "unit_id": 0, "goods_id": 961, "goods_sn": "SP0000074", "unit_name": "盒", "goods_name": "扁盒/亚克力/带内托", "total_price": 525}, {"num": 246, "spec": "235X170X35", "price": 2.6, "unit_id": 0, "goods_id": 959, "goods_sn": "SP0000076", "unit_name": "盒", "goods_name": "大/牛薄脆盒/亚克力", "total_price": 639.6}, {"num": 183, "spec": "乳清奶条盒", "price": 1.2, "unit_id": 0, "goods_id": 958, "goods_sn": "SP0000077", "unit_name": "盒", "goods_name": "小/长方/亚克力/乳清奶条盒", "total_price": 219.6}, {"num": 180, "spec": "待包换/冻炒米 145X85X55", "price": 1.3, "unit_id": 0, "goods_id": 957, "goods_sn": "SP0000078", "unit_name": "盒", "goods_name": "大/长方/亚克力/待用", "total_price": 234}]	从saas.mzth.cn导入 原单号:CG0002853	0	0		2026-03-31 15:29:00.695148	\N
235	CGRK202603311805	499	123	银河包装	牧区纯坊官方品牌	2025-09-30	[{"num": 8, "spec": "1", "price": 0.65, "unit_id": 0, "goods_id": 1029, "goods_sn": "SP0000005", "unit_name": "张", "goods_name": "专内盒/奶果子", "total_price": 5.2}, {"num": 6, "spec": "1", "price": 0.65, "unit_id": 0, "goods_id": 1030, "goods_sn": "SP0000004", "unit_name": "张", "goods_name": "专外盒/奶果子", "total_price": 3.9}]	从saas.mzth.cn导入 原单号:CG0002003	0	0		2026-03-31 15:31:00.197569	\N
240	CGRK202603318548	494	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	[{"num": 77, "spec": "1", "price": 0.05, "unit_id": 0, "goods_id": 1024, "goods_sn": "SP0000010", "unit_name": "张", "goods_name": "标签/不干胶/奶条/甜味", "total_price": 3.85}, {"num": 27, "spec": "1", "price": 0.05, "unit_id": 0, "goods_id": 1023, "goods_sn": "SP0000011", "unit_name": "张", "goods_name": "标签/不干胶/奶条/原味", "total_price": 1.35}]	从saas.mzth.cn导入 原单号:CG0002008	0	0		2026-03-31 15:31:11.798671	\N
242	CGRK202603314892	492	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	[{"num": 14, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 0.84}, {"num": 15, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 0.9}]	从saas.mzth.cn导入 原单号:CG0002010	0	0		2026-03-31 15:31:16.032125	\N
252	CGRK202603313100	482	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	[{"num": 36, "spec": "1", "price": 0.87, "unit_id": 0, "goods_id": 1032, "goods_sn": "SP0000002", "unit_name": "张", "goods_name": "专盒/冻炒米", "total_price": 31.32}, {"num": 20, "spec": "1", "price": 43.5, "unit_id": 0, "goods_id": 1032, "goods_sn": "SP0000002", "unit_name": "捆", "goods_name": "专盒/冻炒米", "total_price": 870}, {"num": 298, "spec": "1", "price": 0.05, "unit_id": 0, "goods_id": 1023, "goods_sn": "SP0000011", "unit_name": "张", "goods_name": "标签/不干胶/奶条/原味", "total_price": 14.9}, {"num": 111, "spec": "1", "price": 0.03, "unit_id": 0, "goods_id": 1020, "goods_sn": "SP0000014", "unit_name": "张", "goods_name": "标签/不干胶/奶果子", "total_price": 3.33}, {"num": 340, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1028, "goods_sn": "SP0000006", "unit_name": "张", "goods_name": "专标签/黄油", "total_price": 20.4}, {"num": 500, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1028, "goods_sn": "SP0000006", "unit_name": "张", "goods_name": "专标签/黄油", "total_price": 30}, {"num": 10, "spec": "1", "price": 0.05, "unit_id": 0, "goods_id": 1024, "goods_sn": "SP0000010", "unit_name": "张", "goods_name": "标签/不干胶/奶条/甜味", "total_price": 0.5}]	从saas.mzth.cn导入 原单号:CG0002020	0	0		2026-03-31 15:31:38.522228	\N
238	CGRK202603318147	496	123	银河包装	牧区纯坊官方品牌	2025-09-30	[{"num": 16, "spec": "1", "price": 0.08, "unit_id": 0, "goods_id": 1026, "goods_sn": "SP0000008", "unit_name": "张", "goods_name": "专内袋/奶果子", "total_price": 1.28}, {"num": 13, "spec": "1", "price": 15.76, "unit_id": 0, "goods_id": 1026, "goods_sn": "SP0000008", "unit_name": "捆", "goods_name": "专内袋/奶果子", "total_price": 204.88}]	从saas.mzth.cn导入 原单号:CG0002006	0	0		2026-03-31 15:31:07.145003	\N
239	CGRK202603318163	495	122	沈阳东源包材厂	牧区纯坊官方品牌	2025-09-30	[{"num": 16, "spec": "1", "price": 0.07, "unit_id": 0, "goods_id": 1025, "goods_sn": "SP0000009", "unit_name": "张", "goods_name": "定制款/专内袋/扎那家奶果子", "total_price": 1.12}, {"num": 170, "spec": "1", "price": 14, "unit_id": 0, "goods_id": 1025, "goods_sn": "SP0000009", "unit_name": "捆", "goods_name": "定制款/专内袋/扎那家奶果子", "total_price": 2380}]	从saas.mzth.cn导入 原单号:CG0002007	0	0		2026-03-31 15:31:09.501352	\N
241	CGRK202603318109	493	120	淘宝紫辰包装	牧区纯坊官方品牌	2025-09-30	[{"num": 90, "spec": "1", "price": 0.55, "unit_id": 0, "goods_id": 1022, "goods_sn": "SP0000012", "unit_name": "张", "goods_name": "专袋/传统奶豆腐", "total_price": 49.5}]	从saas.mzth.cn导入 原单号:CG0002009	0	0		2026-03-31 15:31:13.844576	\N
243	CGRK202603311132	491	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	[{"num": 13, "spec": "1", "price": 0.03, "unit_id": 0, "goods_id": 1020, "goods_sn": "SP0000014", "unit_name": "张", "goods_name": "标签/不干胶/奶果子", "total_price": 0.39}]	从saas.mzth.cn导入 原单号:CG0002011	0	0		2026-03-31 15:31:18.365942	\N
244	CGRK202603318352	490	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	[{"num": 500, "spec": "1", "price": 0.067, "unit_id": 0, "goods_id": 1019, "goods_sn": "SP0000015", "unit_name": "张", "goods_name": "标签/不干胶/冻炒米", "total_price": 33.5}, {"num": 1650, "spec": "1", "price": 0.87, "unit_id": 0, "goods_id": 1032, "goods_sn": "SP0000002", "unit_name": "张", "goods_name": "专盒/冻炒米", "total_price": 1435.5}]	从saas.mzth.cn导入 原单号:CG0002012	0	0		2026-03-31 15:31:20.502628	\N
245	CGRK202603318644	489	119	沈阳乾兴包装	牧区纯坊官方品牌	2025-09-30	[{"num": 30, "spec": "1", "price": 4.55, "unit_id": 0, "goods_id": 1018, "goods_sn": "SP0000016", "unit_name": "张", "goods_name": "礼盒/蓝界", "total_price": 136.5}, {"num": 26, "spec": "1", "price": 4.55, "unit_id": 0, "goods_id": 1018, "goods_sn": "SP0000016", "unit_name": "张", "goods_name": "礼盒/蓝界", "total_price": 118.3}]	从saas.mzth.cn导入 原单号:CG0002013	0	0		2026-03-31 15:31:22.863548	\N
247	CGRK202603319881	487	123	银河包装	牧区纯坊官方品牌	2025-09-30	[{"num": 17, "spec": "1", "price": 35.5, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "捆", "goods_name": "专袋/奶条", "total_price": 603.5}, {"num": 16, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 11.36}, {"num": 47, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 33.37}, {"num": 7, "spec": "1", "price": 35.5, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "捆", "goods_name": "专袋/奶条", "total_price": 248.5}, {"num": 79, "spec": "1", "price": 18.5, "unit_id": 0, "goods_id": 1031, "goods_sn": "SP0000003", "unit_name": "捆", "goods_name": "专底盒/奶条", "total_price": 1461.5}, {"num": 33, "spec": "1", "price": 0.37, "unit_id": 0, "goods_id": 1031, "goods_sn": "SP0000003", "unit_name": "张", "goods_name": "专底盒/奶条", "total_price": 12.21}, {"num": 6, "spec": "1", "price": 0.65, "unit_id": 0, "goods_id": 1030, "goods_sn": "SP0000004", "unit_name": "张", "goods_name": "专外盒/奶果子", "total_price": 3.9}, {"num": 34, "spec": "1", "price": 32.5, "unit_id": 0, "goods_id": 1030, "goods_sn": "SP0000004", "unit_name": "捆", "goods_name": "专外盒/奶果子", "total_price": 1105}, {"num": 24, "spec": "1", "price": 0.65, "unit_id": 0, "goods_id": 1029, "goods_sn": "SP0000005", "unit_name": "张", "goods_name": "专内盒/奶果子", "total_price": 15.6}, {"num": 37, "spec": "1", "price": 26, "unit_id": 0, "goods_id": 1029, "goods_sn": "SP0000005", "unit_name": "捆", "goods_name": "专内盒/奶果子", "total_price": 962}, {"num": 25, "spec": "1", "price": 0.08, "unit_id": 0, "goods_id": 1026, "goods_sn": "SP0000008", "unit_name": "张", "goods_name": "专内袋/奶果子", "total_price": 2}, {"num": 82, "spec": "1", "price": 15.76, "unit_id": 0, "goods_id": 1026, "goods_sn": "SP0000008", "unit_name": "捆", "goods_name": "专内袋/奶果子", "total_price": 1292.32}]	从saas.mzth.cn导入 原单号:CG0002015	0	0		2026-03-31 15:31:27.337488	\N
248	CGRK202603316489	486	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	[{"num": 748, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 44.88}, {"num": 9, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 0.54}, {"num": 260, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 15.6}, {"num": 76, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 4.56}, {"num": 18, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 1.08}]	从saas.mzth.cn导入 原单号:CG0002016	0	0		2026-03-31 15:31:29.661205	\N
249	CGRK202603317845	485	120	淘宝紫辰包装	牧区纯坊官方品牌	2025-09-30	[{"num": 79, "spec": "1", "price": 0.55, "unit_id": 0, "goods_id": 1022, "goods_sn": "SP0000012", "unit_name": "张", "goods_name": "专袋/传统奶豆腐", "total_price": 43.45}, {"num": 23, "spec": "1", "price": 0.55, "unit_id": 0, "goods_id": 1022, "goods_sn": "SP0000012", "unit_name": "张", "goods_name": "专袋/传统奶豆腐", "total_price": 12.65}]	从saas.mzth.cn导入 原单号:CG0002017	0	0		2026-03-31 15:31:31.850449	\N
250	CGRK202603311463	484	120	淘宝紫辰包装	牧区纯坊官方品牌	2025-09-30	[{"num": 20, "spec": "1", "price": 0.17, "unit_id": 0, "goods_id": 1027, "goods_sn": "SP0000007", "unit_name": "张", "goods_name": "真空袋", "total_price": 3.4}]	从saas.mzth.cn导入 原单号:CG0002018	0	0		2026-03-31 15:31:33.890228	\N
251	CGRK202603312514	483	118	淘宝/江苏永发玻璃制品厂	牧区纯坊官方品牌	2025-09-30	[{"num": 55, "spec": "100ML", "price": 1.62, "unit_id": 0, "goods_id": 1016, "goods_sn": "SP0000018", "unit_name": "瓶", "goods_name": "专瓶/黄油", "total_price": 89.1}]	从saas.mzth.cn导入 原单号:CG0002019	0	0		2026-03-31 15:31:36.36097	\N
110	CGRK202603312281	402	113	永巨茶业	牧区纯坊官方品牌	2025-12-29	[{"num": 1, "spec": "1.5kg", "price": 273.05, "unit_id": 0, "goods_id": 870, "goods_sn": "SP0000165", "unit_name": "件", "goods_name": "大青砖茶砖", "total_price": 273.05}, {"num": 1, "spec": "380g", "price": 227.54, "unit_id": 0, "goods_id": 871, "goods_sn": "SP0000164", "unit_name": "件", "goods_name": "小青砖茶砖", "total_price": 227.54}, {"num": 1, "spec": "450g", "price": 204.79, "unit_id": 0, "goods_id": 869, "goods_sn": "SP0000166", "unit_name": "件", "goods_name": "青砖碎茶", "total_price": 204.79}, {"num": 1, "spec": "5g/袋泡茶/30泡", "price": 477.83, "unit_id": 0, "goods_id": 867, "goods_sn": "SP0000168", "unit_name": "件", "goods_name": "5g/青砖袋泡茶", "total_price": 477.83}, {"num": 1, "spec": "450g/25袋", "price": 204.79, "unit_id": 0, "goods_id": 868, "goods_sn": "SP0000167", "unit_name": "件", "goods_name": "16g青砖袋泡茶", "total_price": 204.79}]	从saas.mzth.cn导入 原单号:CG0003427	0	0		2026-03-31 15:26:06.157063	\N
53	CGRK202603314400	351	98	科尔沁奶食品	1号店员专用	2026-03-01	[{"num": 5, "spec": "1斤散称", "price": 22, "unit_id": 0, "goods_id": 902, "goods_sn": "SP0000133", "unit_name": "斤", "goods_name": "乌日莫糖/散装", "total_price": 110}]	从saas.mzth.cn导入 原单号:CG0004469	0	0		2026-03-31 12:22:01.061545	\N
61	CGRK202603316167	353	74	德吉奶食品	1号店员专用	2026-02-26	[{"num": 10, "spec": "1L", "price": 15, "unit_id": 0, "goods_id": 804, "goods_sn": "SP0000232", "unit_name": "瓶", "goods_name": "德吉酸奶/2斤装", "total_price": 150}, {"num": 10, "spec": "500mL", "price": 8, "unit_id": 0, "goods_id": 805, "goods_sn": "SP0000231", "unit_name": "瓶", "goods_name": "德吉酸奶/一斤装", "total_price": 80}, {"num": 10, "spec": "250mL", "price": 4, "unit_id": 0, "goods_id": 806, "goods_sn": "SP0000230", "unit_name": "瓶", "goods_name": "德吉酸奶/半斤", "total_price": 40}]	从saas.mzth.cn导入 原单号:CG0004475	0	0		2026-03-31 15:24:06.543525	\N
89	CGRK202603318248	382	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-19	[{"num": 3, "spec": "1.2", "price": 33, "unit_id": 0, "goods_id": 856, "goods_sn": "SP0000179", "unit_name": "张", "goods_name": "科尔沁/大奶豆腐", "total_price": 99}, {"num": 1, "spec": "10斤装/麻袋", "price": 48, "unit_id": 0, "goods_id": 923, "goods_sn": "SP0000112", "unit_name": "麻袋", "goods_name": "炒米/散装/硬口", "total_price": 48}]	从saas.mzth.cn导入 原单号:CG0003897	0	0		2026-03-31 15:25:11.20257	\N
102	CGRK202603311529	394	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-07	[{"num": 1, "spec": "10斤装/麻袋", "price": 48, "unit_id": 0, "goods_id": 923, "goods_sn": "SP0000112", "unit_name": "麻袋", "goods_name": "炒米/散装/硬口", "total_price": 48}, {"num": 10, "spec": "斤/两盒", "price": 22, "unit_id": 0, "goods_id": 981, "goods_sn": "SP0000053", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 220}, {"num": 3, "spec": "1斤", "price": 85, "unit_id": 0, "goods_id": 908, "goods_sn": "SP0000127", "unit_name": "袋", "goods_name": "哈斯乌拉牛肉干500g原味", "total_price": 255}, {"num": 2, "spec": "1斤", "price": 95, "unit_id": 0, "goods_id": 907, "goods_sn": "SP0000128", "unit_name": "袋", "goods_name": "风干牛肉500g大片", "total_price": 190}]	从saas.mzth.cn导入 原单号:CG0003599	0	0		2026-03-31 15:25:48.729231	\N
122	CGRK202603312735	254	97	纯净奶食品	牧区纯坊官方品牌	2025-12-25	[{"num": 40, "spec": "180克", "price": 14, "unit_id": 0, "goods_id": 946, "goods_sn": "SP0000089", "unit_name": "盒", "goods_name": "半成品/透明/鲜奶皮", "total_price": 560}, {"num": 50, "spec": "180克", "price": 13, "unit_id": 0, "goods_id": 945, "goods_sn": "SP0000090", "unit_name": "盒", "goods_name": "半成品/透明/奶皮卷", "total_price": 650}, {"num": 20, "spec": "150克", "price": 12, "unit_id": 0, "goods_id": 944, "goods_sn": "SP0000091", "unit_name": "盒", "goods_name": "半成品/透明/奶皮千层", "total_price": 240}, {"num": 35, "spec": "1", "price": 6, "unit_id": 0, "goods_id": 974, "goods_sn": "SP0000060", "unit_name": "瓶", "goods_name": "纯净黄油/瓶装好的", "total_price": 210}, {"num": 10, "spec": "1斤装", "price": 22, "unit_id": 0, "goods_id": 899, "goods_sn": "SP0000136", "unit_name": "瓶", "goods_name": "纯净/黄油/斤", "total_price": 220}, {"num": 4, "spec": "斤", "price": 10, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 40}, {"num": 30, "spec": "150-180克", "price": 13, "unit_id": 0, "goods_id": 968, "goods_sn": "SP0000066", "unit_name": "张", "goods_name": "大/奶皮", "total_price": 390}]	从saas.mzth.cn导入 原单号:CG0003286	0	0		2026-03-31 15:26:33.210907	\N
132	CGRK202603315580	415	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-17	[{"num": 20, "spec": "半斤", "price": 14, "unit_id": 0, "goods_id": 916, "goods_sn": "SP0000119", "unit_name": "斤", "goods_name": "脆奶条/散装/科尔沁", "total_price": 280}, {"num": 7, "spec": "1盒", "price": 15, "unit_id": 0, "goods_id": 889, "goods_sn": "SP0000146", "unit_name": "盒", "goods_name": "奶皮卷/科尔沁", "total_price": 105}, {"num": 2, "spec": "1", "price": 7, "unit_id": 0, "goods_id": 886, "goods_sn": "SP0000149", "unit_name": "盒", "goods_name": "冻炒米/科尔沁", "total_price": 14}, {"num": 4, "spec": "320克", "price": 25, "unit_id": 0, "goods_id": 887, "goods_sn": "SP0000148", "unit_name": "盒", "goods_name": "羊乳奶粉/奶茶专用", "total_price": 100}, {"num": 4, "spec": "320克", "price": 14, "unit_id": 0, "goods_id": 888, "goods_sn": "SP0000147", "unit_name": "盒", "goods_name": "河套奶粉", "total_price": 56}]	从saas.mzth.cn导入 原单号:CG0003078	0	0		2026-03-31 15:26:56.055397	\N
143	CGRK202603315807	265	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2025-12-14	[{"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 891, "goods_sn": "SP0000144", "unit_name": "小包", "goods_name": "芝士奶豆腐月饼", "total_price": 50}, {"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 893, "goods_sn": "SP0000142", "unit_name": "小包", "goods_name": "奶豆腐月饼", "total_price": 50}, {"num": 10, "spec": "250", "price": 4, "unit_id": 0, "goods_id": 892, "goods_sn": "SP0000143", "unit_name": "盒", "goods_name": "那牧尔酸奶", "total_price": 40}, {"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 895, "goods_sn": "SP0000140", "unit_name": "小包", "goods_name": "黄油渣月饼", "total_price": 50}, {"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 896, "goods_sn": "SP0000139", "unit_name": "小包", "goods_name": "奶皮月饼", "total_price": 50}, {"num": 10, "spec": "5", "price": 10, "unit_id": 0, "goods_id": 897, "goods_sn": "SP0000138", "unit_name": "袋", "goods_name": "早餐包/那牧尔", "total_price": 100}, {"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 894, "goods_sn": "SP0000141", "unit_name": "小包", "goods_name": "酸奶月饼", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0003017	0	0		2026-03-31 15:27:20.51262	\N
121	CGRK202603319433	255	90	阿润查干	牧区纯坊官方品牌	2025-12-25	[{"num": 4, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 880, "goods_sn": "SP0000155", "unit_name": "袋", "goods_name": "阿润月饼/五仁馅", "total_price": 40}, {"num": 4, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 879, "goods_sn": "SP0000156", "unit_name": "盒", "goods_name": "干肉奶茶", "total_price": 22}, {"num": 4, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 881, "goods_sn": "SP0000154", "unit_name": "袋", "goods_name": "阿润月饼/奶皮子馅", "total_price": 40}, {"num": 4, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 882, "goods_sn": "SP0000153", "unit_name": "袋", "goods_name": "阿润月饼/黄油渣馅", "total_price": 40}, {"num": 4, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 883, "goods_sn": "SP0000152", "unit_name": "袋", "goods_name": "阿润月饼/奶豆腐馅", "total_price": 40}]	从saas.mzth.cn导入 原单号:CG0003285	0	0		2026-03-31 15:26:31.150739	\N
180	CGRK202603316519	281	97	纯净奶食品	牧区纯坊官方品牌	2025-12-05	[{"num": 19, "spec": "1斤2两", "price": 25, "unit_id": 0, "goods_id": 926, "goods_sn": "SP0000109", "unit_name": "个", "goods_name": "大奶豆腐砖/1.2斤", "total_price": 475}, {"num": 20, "spec": "1斤", "price": 20, "unit_id": 0, "goods_id": 927, "goods_sn": "SP0000108", "unit_name": "个", "goods_name": "小奶豆腐砖/1斤", "total_price": 400}, {"num": 20, "spec": "1斤", "price": 20, "unit_id": 0, "goods_id": 925, "goods_sn": "SP0000110", "unit_name": "个", "goods_name": "小/无印花/奶豆腐砖/1斤", "total_price": 400}, {"num": 29, "spec": "180克", "price": 14, "unit_id": 0, "goods_id": 946, "goods_sn": "SP0000089", "unit_name": "盒", "goods_name": "半成品/透明/鲜奶皮", "total_price": 406}, {"num": 6, "spec": "180克", "price": 14, "unit_id": 0, "goods_id": 945, "goods_sn": "SP0000090", "unit_name": "盒", "goods_name": "半成品/透明/奶皮卷", "total_price": 84}, {"num": 40, "spec": "200克", "price": 13, "unit_id": 0, "goods_id": 939, "goods_sn": "SP0000096", "unit_name": "盒", "goods_name": "半成品/透明/原味/鲜奶酪", "total_price": 520}, {"num": 40, "spec": "200克", "price": 13, "unit_id": 0, "goods_id": 940, "goods_sn": "SP0000095", "unit_name": "盒", "goods_name": "半成品/透明/甜味/鲜奶酪", "total_price": 520}]	从saas.mzth.cn导入 原单号:CG0002866	0	0		2026-03-31 15:28:54.272649	\N
156	CGRK202603316269	276	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-10	[{"num": 30, "spec": "1斤", "price": 5.46667, "unit_id": 0, "goods_id": 901, "goods_sn": "SP0000134", "unit_name": "麻袋", "goods_name": "手工白花炒米/散装", "total_price": 164}, {"num": 5, "spec": "1斤散称", "price": 22, "unit_id": 0, "goods_id": 902, "goods_sn": "SP0000133", "unit_name": "斤", "goods_name": "乌日莫糖/散装", "total_price": 110}, {"num": 4, "spec": "250克", "price": 8, "unit_id": 0, "goods_id": 915, "goods_sn": "SP0000120", "unit_name": "盒", "goods_name": "黄油渣/盒", "total_price": 32}, {"num": 10, "spec": "斤/两盒", "price": 22, "unit_id": 0, "goods_id": 981, "goods_sn": "SP0000053", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 220}]	从saas.mzth.cn导入 原单号:CG0002950	0	0		2026-03-31 15:27:53.934356	\N
167	CGRK202603312692	277	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-09	[{"num": 2, "spec": "1斤", "price": 95, "unit_id": 0, "goods_id": 907, "goods_sn": "SP0000128", "unit_name": "袋", "goods_name": "风干牛肉500g大片", "total_price": 190}, {"num": 2, "spec": "1斤", "price": 83, "unit_id": 0, "goods_id": 908, "goods_sn": "SP0000127", "unit_name": "袋", "goods_name": "哈斯乌拉牛肉干500g原味", "total_price": 166}, {"num": 2, "spec": "450g", "price": 7, "unit_id": 0, "goods_id": 909, "goods_sn": "SP0000126", "unit_name": "袋", "goods_name": "蓝旗绿乳糖惠虹糖", "total_price": 14}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 910, "goods_sn": "SP0000125", "unit_name": "袋", "goods_name": "蓝旗绿乳糖奶香酥", "total_price": 8}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 911, "goods_sn": "SP0000124", "unit_name": "袋", "goods_name": "蓝旗绿乳糖果仁酥", "total_price": 8}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 912, "goods_sn": "SP0000123", "unit_name": "袋", "goods_name": "蓝旗绿乳糖水果", "total_price": 8}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 913, "goods_sn": "SP0000122", "unit_name": "袋", "goods_name": "蓝旗绿乳糖黄油球", "total_price": 8}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 914, "goods_sn": "SP0000121", "unit_name": "袋", "goods_name": "蓝旗绿乳糖炼乳", "total_price": 8}, {"num": 1, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 15}, {"num": 1, "spec": "1斤散称", "price": 10, "unit_id": 0, "goods_id": 922, "goods_sn": "SP0000113", "unit_name": "斤", "goods_name": "酸奶炒米糖/散装", "total_price": 10}, {"num": 4, "spec": "250克", "price": 8, "unit_id": 0, "goods_id": 915, "goods_sn": "SP0000120", "unit_name": "盒", "goods_name": "黄油渣/盒", "total_price": 32}, {"num": 10, "spec": "半斤", "price": 14, "unit_id": 0, "goods_id": 916, "goods_sn": "SP0000119", "unit_name": "斤", "goods_name": "脆奶条/散装/科尔沁", "total_price": 140}, {"num": 2, "spec": "500g", "price": 17, "unit_id": 0, "goods_id": 905, "goods_sn": "SP0000130", "unit_name": "袋", "goods_name": "真空奶豆腐砖/甜味", "total_price": 34}, {"num": 2, "spec": "500g", "price": 17, "unit_id": 0, "goods_id": 906, "goods_sn": "SP0000129", "unit_name": "袋", "goods_name": "真空奶豆腐砖/原味", "total_price": 34}, {"num": 2, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 903, "goods_sn": "SP0000132", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/甜味", "total_price": 38}, {"num": 2, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 904, "goods_sn": "SP0000131", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/原味", "total_price": 38}]	从saas.mzth.cn导入 原单号:CG0002914	0	0		2026-03-31 15:28:23.155421	\N
210	CGRK202603312720	459	114	阿旗北方	牧区纯坊官方品牌	2025-11-01	[{"num": 1, "spec": "100克", "price": 7.08, "unit_id": 0, "goods_id": 989, "goods_sn": "SP0000045", "unit_name": "瓶", "goods_name": "蒙古黄油/瓶装成品", "total_price": 7.08}, {"num": 2, "spec": "100克", "price": 7.08, "unit_id": 0, "goods_id": 989, "goods_sn": "SP0000045", "unit_name": "瓶", "goods_name": "蒙古黄油/瓶装成品", "total_price": 14.16}, {"num": 2, "spec": "150", "price": 12.78, "unit_id": 0, "goods_id": 988, "goods_sn": "SP0000046", "unit_name": "袋", "goods_name": "原味传统奶豆腐/成品袋装", "total_price": 25.56}]	从saas.mzth.cn导入 原单号:CG0002419	0	0		2026-03-31 15:30:01.604504	\N
159	CGRK202603315560	272	121	盛大印刷	牧区纯坊官方品牌	2025-12-10	[{"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 900, "goods_sn": "SP0000135", "unit_name": "张", "goods_name": "透专标签/脆香奶条/微甜", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 950, "goods_sn": "SP0000085", "unit_name": "张", "goods_name": "透专标签/奶皮卷", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 951, "goods_sn": "SP0000084", "unit_name": "张", "goods_name": "透专标签/冻炒米", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 952, "goods_sn": "SP0000083", "unit_name": "张", "goods_name": "透专标签/奶酪/原味", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 953, "goods_sn": "SP0000082", "unit_name": "张", "goods_name": "透专标签/奶酪/甜味", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 956, "goods_sn": "SP0000079", "unit_name": "张", "goods_name": "透专标签/鲜奶皮", "total_price": 160.5}]	从saas.mzth.cn导入 原单号:CG0002955	0	0		2026-03-31 15:28:01.454094	\N
\.


--
-- Data for Name: procure_plan; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.procure_plan (id, order_no, plan_date, goods_info, remark, status, admin_name, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: procure_return; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.procure_return (id, order_no, order_sn, order_id, supplier_id, supplier_name, admin_name, return_date, total_amount, goods_info, remark, status, warehouse_id, warehouse_name, fund_id, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: purchase_order; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.purchase_order (id, order_no, order_sn, supplier_id, supplier_name, admin_name, order_date, total_amount, pay_amount, freight_amount, goods_info, remark, status, warehouse_id, warehouse_name, fund_id, fund_name, created_at, deleted_at) FROM stdin;
34	CG202603308526	CG202603307396	123			2026-02-26	0.00	0.00	0.00	[{"num": 1, "price": 1, "unit_id": 1, "goods_id": 1033, "goods_name": "test", "total_price": 1}]	test	0	0		0		2026-03-30 16:53:46.935122	\N
47	CG202603307240	CG202603301552	98			2026-02-12	0.00	0.00	0.00	[{"num": 30, "price": 4.83333, "unit_id": 0, "goods_id": 923, "goods_name": "炒米/散装/硬口", "total_price": 145}]	从saas.mzth.cn导入 原单号:CG0004414	0	0		0		2026-03-30 16:55:29.093903	2026-03-30 17:20:52.366762
45	CG202603309024	CG202603305956	75			2026-02-23	0.00	0.00	0.00	[{"num": 12, "price": 8.33333, "unit_id": 0, "goods_id": 811, "goods_name": "蒙古果子/格日勒", "total_price": 100}]	从saas.mzth.cn导入 原单号:CG0004426	0	0		0		2026-03-30 16:55:27.84861	2026-03-30 17:20:53.547312
44	CG202603304141	CG202603305936	98			2026-02-23	0.00	0.00	0.00	[{"num": 10, "price": 85, "unit_id": 0, "goods_id": 908, "goods_name": "哈斯乌拉牛肉干500g原味", "total_price": 850}]	从saas.mzth.cn导入 原单号:CG0004427	0	0		0		2026-03-30 16:55:27.209137	2026-03-30 17:20:54.012261
43	CG202603306739	CG202603308374	98			2026-02-23	0.00	0.00	0.00	[{"num": 5, "price": 33, "unit_id": 0, "goods_id": 856, "goods_name": "科尔沁/大奶豆腐", "total_price": 165}, {"num": 5, "price": 19, "unit_id": 0, "goods_id": 829, "goods_name": "奶豆腐/原味/中/科尔沁", "total_price": 95}, {"num": 5, "price": 19, "unit_id": 0, "goods_id": 903, "goods_name": "盛宇燃奶豆腐/甜味", "total_price": 95}, {"num": 5, "price": 19, "unit_id": 0, "goods_id": 904, "goods_name": "盛宇燃奶豆腐/原味", "total_price": 95}]	从saas.mzth.cn导入 原单号:CG0004428	0	0		0		2026-03-30 16:55:26.584563	2026-03-30 17:20:54.553638
42	CG202603303194	CG202603308988	98			2026-02-23	0.00	0.00	0.00	[{"num": 5, "price": 95, "unit_id": 0, "goods_id": 907, "goods_name": "风干牛肉500g大片", "total_price": 475}, {"num": 5, "price": 15, "unit_id": 0, "goods_id": 921, "goods_name": "嚼口脆炒米糖/散装", "total_price": 75}, {"num": 20, "price": 5.5, "unit_id": 0, "goods_id": 932, "goods_name": "炒米海丰", "total_price": 110}, {"num": 10, "price": 4.8, "unit_id": 0, "goods_id": 931, "goods_name": "炒米粉/aag", "total_price": 48}, {"num": 10, "price": 15, "unit_id": 0, "goods_id": 823, "goods_name": "黄油/中瓶", "total_price": 150}]	从saas.mzth.cn导入 原单号:CG0004429	0	0		0		2026-03-30 16:55:25.921254	2026-03-30 17:20:55.197899
41	CG202603302988	CG202603303185	84			2026-02-27	0.00	0.00	0.00	[{"num": 20, "price": 19, "unit_id": 0, "goods_id": 857, "goods_name": "厚奶皮", "total_price": 380}]	从saas.mzth.cn导入 原单号:CG0004457	0	0		0		2026-03-30 16:55:25.264737	2026-03-30 17:20:55.77872
40	CG202603301592	CG202603304641	98			2026-03-01	0.00	0.00	0.00	[{"num": 5, "price": 22, "unit_id": 0, "goods_id": 902, "goods_name": "乌日莫糖/散装", "total_price": 110}]	从saas.mzth.cn导入 原单号:CG0004469	0	0		0		2026-03-30 16:55:24.570795	2026-03-30 17:20:56.236624
39	CG202603302952	CG202603309881	98			2026-03-01	0.00	0.00	0.00	[{"num": 5, "price": 15, "unit_id": 0, "goods_id": 921, "goods_name": "嚼口脆炒米糖/散装", "total_price": 75}]	从saas.mzth.cn导入 原单号:CG0004470	0	0		0		2026-03-30 16:55:23.954567	2026-03-30 17:20:56.719314
38	CG202603302248	CG202603309525	98			2026-03-01	0.00	0.00	0.00	[{"num": 5, "price": 10, "unit_id": 0, "goods_id": 922, "goods_name": "酸奶炒米糖/散装", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0004471	0	0		0		2026-03-30 16:55:23.350913	2026-03-30 17:20:57.177599
37	CG202603302202	CG202603307532	98			2026-03-01	0.00	0.00	0.00	[{"num": 10, "price": 5, "unit_id": 0, "goods_id": 920, "goods_name": "手工乌日末液体", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0004472	0	0		0		2026-03-30 16:55:22.721476	2026-03-30 17:20:57.699415
36	CG202603307994	CG202603302599	98			2026-03-01	0.00	0.00	0.00	[{"num": 10, "price": 22, "unit_id": 0, "goods_id": 981, "goods_name": "烤奶皮", "total_price": 220}]	从saas.mzth.cn导入 原单号:CG0004473	0	0		0		2026-03-30 16:55:22.083506	2026-03-30 17:20:58.381011
35	CG202603302280	CG202603308130	74			2026-02-26	0.00	0.00	0.00	[{"num": 10, "price": 15, "unit_id": 0, "goods_id": 804, "goods_name": "德吉酸奶/2斤装", "total_price": 150}, {"num": 10, "price": 8, "unit_id": 0, "goods_id": 805, "goods_name": "德吉酸奶/一斤装", "total_price": 80}, {"num": 10, "price": 4, "unit_id": 0, "goods_id": 806, "goods_name": "德吉酸奶/半斤", "total_price": 40}]	从saas.mzth.cn导入 原单号:CG0004475	0	0		0		2026-03-30 16:55:21.459108	2026-03-30 17:21:00.162685
61	CG202603301674	CG202603303613	81			2026-01-27	0.00	0.00	0.00	[{"num": 20, "price": 4.5, "unit_id": 0, "goods_id": 845, "goods_name": "乳清饮料", "total_price": 90}, {"num": 6, "price": 6, "unit_id": 0, "goods_id": 846, "goods_name": "酸奶/额吉伊德", "total_price": 36}, {"num": 5, "price": 7, "unit_id": 0, "goods_id": 847, "goods_name": "乌日莫/袋装", "total_price": 35}]	从saas.mzth.cn导入 原单号:CG0004116	0	0		0		2026-03-30 16:55:37.826678	2026-03-30 17:18:12.629863
59	CG202603308044	CG202603306508	79			2026-01-27	0.00	0.00	0.00	[{"num": 540, "price": 5.1592, "unit_id": 0, "goods_id": 836, "goods_name": "礼盒/2026", "total_price": 2785.97}]	从saas.mzth.cn导入 原单号:CG0004118	0	0		0		2026-03-30 16:55:36.558127	2026-03-30 17:18:15.843438
58	CG202603307199	CG202603304028	98			2026-02-01	0.00	0.00	0.00	[{"num": 40, "price": 22, "unit_id": 0, "goods_id": 981, "goods_name": "烤奶皮", "total_price": 880}, {"num": 3, "price": 19, "unit_id": 0, "goods_id": 903, "goods_name": "盛宇燃奶豆腐/甜味", "total_price": 57}, {"num": 4, "price": 19, "unit_id": 0, "goods_id": 904, "goods_name": "盛宇燃奶豆腐/原味", "total_price": 76}, {"num": 10, "price": 15, "unit_id": 0, "goods_id": 921, "goods_name": "嚼口脆炒米糖/散装", "total_price": 150}]	从saas.mzth.cn导入 原单号:CG0004239	0	0		0		2026-03-30 16:55:35.936108	2026-03-30 17:18:17.503696
57	CG202603302788	CG202603308395	92			2025-12-31	0.00	0.00	0.00	[{"num": 5, "price": 11, "unit_id": 0, "goods_id": 918, "goods_name": "黄油/半斤", "total_price": 55}, {"num": 5, "price": 20, "unit_id": 0, "goods_id": 919, "goods_name": "黄油/斤", "total_price": 100}, {"num": 10, "price": 16, "unit_id": 0, "goods_id": 885, "goods_name": "冻炒米/散装", "total_price": 160}]	从saas.mzth.cn导入 原单号:CG0004240	0	0		0		2026-03-30 16:55:35.30144	2026-03-30 17:18:18.100822
56	CG202603308307	CG202603303376	86			2026-02-01	0.00	0.00	0.00	[{"num": 10, "price": 10, "unit_id": 0, "goods_id": 860, "goods_name": "普通瓜子", "total_price": 100}]	从saas.mzth.cn导入 原单号:CG0004241	0	0		0		2026-03-30 16:55:34.679466	2026-03-30 17:18:18.801083
55	CG202603306726	CG202603301190	90			2026-02-01	0.00	0.00	0.00	[{"num": 10, "price": 10, "unit_id": 0, "goods_id": 880, "goods_name": "阿润月饼/五仁馅", "total_price": 100}, {"num": 5, "price": 10, "unit_id": 0, "goods_id": 882, "goods_name": "阿润月饼/黄油渣馅", "total_price": 50}, {"num": 5, "price": 10, "unit_id": 0, "goods_id": 831, "goods_name": "果条/阿润", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0004242	0	0		0		2026-03-30 16:55:34.066821	2026-03-30 17:18:22.130979
54	CG202603302981	CG202603306200	84			2026-02-04	0.00	0.00	0.00	[{"num": 20, "price": 19, "unit_id": 0, "goods_id": 857, "goods_name": "厚奶皮", "total_price": 380}]	从saas.mzth.cn导入 原单号:CG0004287	0	0		0		2026-03-30 16:55:33.46515	2026-03-30 17:18:23.169053
53	CG202603304635	CG202603307173	98			2026-02-04	0.00	0.00	0.00	[{"num": 10, "price": 5, "unit_id": 0, "goods_id": 920, "goods_name": "手工乌日末液体", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0004288	0	0		0		2026-03-30 16:55:32.857097	2026-03-30 17:18:24.05508
52	CG202603303379	CG202603308083	78			2026-02-08	0.00	0.00	0.00	[{"num": 2, "price": 19, "unit_id": 0, "goods_id": 830, "goods_name": "小米/10斤/小袋", "total_price": 38}, {"num": 5, "price": 19, "unit_id": 0, "goods_id": 830, "goods_name": "小米/10斤/小袋", "total_price": 95}, {"num": 8, "price": 55, "unit_id": 0, "goods_id": 809, "goods_name": "10斤装/小米/绿色纸盒", "total_price": 440}]	从saas.mzth.cn导入 原单号:CG0004363	0	0		0		2026-03-30 16:55:32.213481	2026-03-30 17:18:25.806203
51	CG202603308379	CG202603307952	98			2026-02-09	0.00	0.00	0.00	[{"num": 5, "price": 19, "unit_id": 0, "goods_id": 829, "goods_name": "奶豆腐/原味/中/科尔沁", "total_price": 95}]	从saas.mzth.cn导入 原单号:CG0004368	0	0		0		2026-03-30 16:55:31.59473	2026-03-30 17:20:50.11349
50	CG202603308869	CG202603303061	98			2026-02-09	0.00	0.00	0.00	[{"num": 30, "price": 5.26667, "unit_id": 0, "goods_id": 901, "goods_name": "手工白花炒米/散装", "total_price": 158}]	从saas.mzth.cn导入 原单号:CG0004383	0	0		0		2026-03-30 16:55:30.961658	2026-03-30 17:20:50.85945
49	CG202603305824	CG202603307348	98			2026-02-10	0.00	0.00	0.00	[{"num": 10, "price": 5, "unit_id": 0, "goods_id": 920, "goods_name": "手工乌日末液体", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0004384	0	0		0		2026-03-30 16:55:30.33688	2026-03-30 17:20:51.323964
80	CG202603309812	CG202603305315	98			2026-01-11	0.00	0.00	0.00	[{"num": 10, "price": 5, "unit_id": 0, "goods_id": 920, "goods_name": "手工乌日末液体", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0003704	0	0		0		2026-03-30 16:55:51.077475	2026-03-30 17:17:32.675559
79	CG202603307681	CG202603309791	96			2026-01-11	0.00	0.00	0.00	[{"num": 720, "price": 0.84967, "unit_id": 0, "goods_id": 963, "goods_name": "小/方形/亚克力盒/", "total_price": 611.76}]	从saas.mzth.cn导入 原单号:CG0003705	0	0		0		2026-03-30 16:55:50.428769	2026-03-30 17:17:35.594615
78	CG202603308991	CG202603305936	86			2026-01-11	0.00	0.00	0.00	[{"num": 5, "price": 10, "unit_id": 0, "goods_id": 860, "goods_name": "普通瓜子", "total_price": 50}, {"num": 10, "price": 15, "unit_id": 0, "goods_id": 861, "goods_name": "五香瓜子", "total_price": 150}]	从saas.mzth.cn导入 原单号:CG0003706	0	0		0		2026-03-30 16:55:49.766278	2026-03-30 17:17:36.434338
77	CG202603308176	CG202603303687	98			2026-01-11	0.00	0.00	0.00	[{"num": 10, "price": 4.8, "unit_id": 0, "goods_id": 931, "goods_name": "炒米粉/aag", "total_price": 48}]	从saas.mzth.cn导入 原单号:CG0003707	0	0		0		2026-03-30 16:55:49.037355	2026-03-30 17:17:37.88497
76	CG202603303962	CG202603308936	90			2026-01-16	0.00	0.00	0.00	[{"num": 10, "price": 5.5, "unit_id": 0, "goods_id": 879, "goods_name": "干肉奶茶", "total_price": 55}, {"num": 25, "price": 25, "unit_id": 0, "goods_id": 859, "goods_name": "糖/阿润", "total_price": 625}]	从saas.mzth.cn导入 原单号:CG0003838	0	0		0		2026-03-30 16:55:48.362365	2026-03-30 17:17:39.007271
75	CG202603305124	CG202603304106	85			2026-01-16	0.00	0.00	0.00	[{"num": 40, "price": 6, "unit_id": 0, "goods_id": 858, "goods_name": "糖葫芦", "total_price": 240}]	从saas.mzth.cn导入 原单号:CG0003839	0	0		0		2026-03-30 16:55:47.753555	2026-03-30 17:17:45.356153
74	CG202603307790	CG202603303921	113			2026-01-16	0.00	0.00	0.00	[{"num": 10, "price": 331, "unit_id": 0, "goods_id": 1011, "goods_name": "茶包", "total_price": 3310}]	从saas.mzth.cn导入 原单号:CG0003840	0	0		0		2026-03-30 16:55:47.046374	2026-03-30 17:17:46.789716
73	CG202603303779	CG202603307278	84			2026-01-17	0.00	0.00	0.00	[{"num": 10, "price": 19, "unit_id": 0, "goods_id": 857, "goods_name": "厚奶皮", "total_price": 190}]	从saas.mzth.cn导入 原单号:CG0003860	0	0		0		2026-03-30 16:55:46.409921	2026-03-30 17:17:51.087979
72	CG202603304355	CG202603305127	98			2026-01-17	0.00	0.00	0.00	[{"num": 10, "price": 22, "unit_id": 0, "goods_id": 981, "goods_name": "烤奶皮", "total_price": 220}, {"num": 30, "price": 5.26667, "unit_id": 0, "goods_id": 901, "goods_name": "手工白花炒米/散装", "total_price": 158}]	从saas.mzth.cn导入 原单号:CG0003873	0	0		0		2026-03-30 16:55:45.781081	2026-03-30 17:17:52.023265
71	CG202603305628	CG202603302216	98			2026-01-19	0.00	0.00	0.00	[{"num": 3, "price": 33, "unit_id": 0, "goods_id": 856, "goods_name": "科尔沁/大奶豆腐", "total_price": 99}, {"num": 1, "price": 48, "unit_id": 0, "goods_id": 923, "goods_name": "炒米/散装/硬口", "total_price": 48}]	从saas.mzth.cn导入 原单号:CG0003897	0	0		0		2026-03-30 16:55:44.080416	2026-03-30 17:17:53.405751
70	CG202603309782	CG202603307332	115			2026-01-19	0.00	0.00	0.00	[{"num": 130, "price": 48.95385, "unit_id": 0, "goods_id": 872, "goods_name": "半成品/黄金纬度牛肉干/那牧尔", "total_price": 6364}]	从saas.mzth.cn导入 原单号:CG0003899	0	0		0		2026-03-30 16:55:43.45206	2026-03-30 17:17:54.7558
69	CG202603306950	CG202603302114	98			2026-01-20	0.00	0.00	0.00	[{"num": 10, "price": 8, "unit_id": 0, "goods_id": 920, "goods_name": "手工乌日末液体", "total_price": 80}]	从saas.mzth.cn导入 原单号:CG0003930	0	0		0		2026-03-30 16:55:42.833893	2026-03-30 17:17:55.885442
68	CG202603304627	CG202603309398	83			2026-01-20	0.00	0.00	0.00	[{"num": 5, "price": 18, "unit_id": 0, "goods_id": 855, "goods_name": "奶锅巴/扎旗吉十奶制品", "total_price": 90}]	从saas.mzth.cn导入 原单号:CG0003933	0	0		0		2026-03-30 16:55:42.222454	2026-03-30 17:17:57.446525
66	CG202603307516	CG202603301993	85			2026-01-20	0.00	0.00	0.00	[{"num": 10, "price": 14, "unit_id": 0, "goods_id": 851, "goods_name": "晴王糖葫芦", "total_price": 140}]	从saas.mzth.cn导入 原单号:CG0003936	0	0		0		2026-03-30 16:55:40.966122	2026-03-30 17:18:03.07329
65	CG202603302536	CG202603305227	93			2026-01-20	0.00	0.00	0.00	[{"num": 100, "price": 0.4936, "unit_id": 0, "goods_id": 850, "goods_name": "红糖袋/delicious", "total_price": 49.36}]	从saas.mzth.cn导入 原单号:CG0003944	0	0		0		2026-03-30 16:55:40.349533	2026-03-30 17:18:05.936133
64	CG202603305955	CG202603306658	106			2026-01-20	0.00	0.00	0.00	[{"num": 2000, "price": 0.07, "unit_id": 0, "goods_id": 993, "goods_name": "冻炒米专用/塑膜袋", "total_price": 140}]	从saas.mzth.cn导入 原单号:CG0003945	0	0		0		2026-03-30 16:55:39.711097	2026-03-30 17:18:07.665452
63	CG202603303109	CG202603301382	98			2026-01-24	0.00	0.00	0.00	[{"num": 5, "price": 22, "unit_id": 0, "goods_id": 902, "goods_name": "乌日莫糖/散装", "total_price": 110}, {"num": 5, "price": 10, "unit_id": 0, "goods_id": 922, "goods_name": "酸奶炒米糖/散装", "total_price": 50}, {"num": 5, "price": 15, "unit_id": 0, "goods_id": 921, "goods_name": "嚼口脆炒米糖/散装", "total_price": 75}, {"num": 5, "price": 33, "unit_id": 0, "goods_id": 856, "goods_name": "科尔沁/大奶豆腐", "total_price": 165}]	从saas.mzth.cn导入 原单号:CG0004043	0	0		0		2026-03-30 16:55:39.067878	2026-03-30 17:18:09.303878
96	CG202603309903	CG202603306098	121			2025-12-25	0.00	0.00	0.00	[{"num": 500, "price": 0.067, "unit_id": 0, "goods_id": 898, "goods_name": "透专标签/奶皮千层", "total_price": 33.5}]	从saas.mzth.cn导入 原单号:CG0003289	0	0		0		2026-03-30 16:56:02.075126	2026-03-30 17:17:06.079334
94	CG202603309969	CG202603301047	98			2025-12-28	0.00	0.00	0.00	[{"num": 6, "price": 12.5, "unit_id": 0, "goods_id": 878, "goods_name": "羊奶粉/1斤", "total_price": 75}]	从saas.mzth.cn导入 原单号:CG0003393	0	0		0		2026-03-30 16:56:00.829195	2026-03-30 17:17:08.171118
92	CG202603304118	CG202603304284	111			2025-12-07	0.00	0.00	0.00	[{"num": 3000, "price": 1.46667, "unit_id": 0, "goods_id": 873, "goods_name": "专袋/牛肉干包装", "total_price": 4400.01}]	从saas.mzth.cn导入 原单号:CG0003407	0	0		0		2026-03-30 16:55:59.592898	2026-03-30 17:17:11.040083
91	CG202603303564	CG202603301668	98			2025-12-28	0.00	0.00	0.00	[{"num": 5, "price": 15, "unit_id": 0, "goods_id": 921, "goods_name": "嚼口脆炒米糖/散装", "total_price": 75}]	从saas.mzth.cn导入 原单号:CG0003418	0	0		0		2026-03-30 16:55:58.977708	2026-03-30 17:17:13.040312
90	CG202603304476	CG202603306392	113			2025-12-29	0.00	0.00	0.00	[{"num": 1, "price": 273.05, "unit_id": 0, "goods_id": 870, "goods_name": "大青砖茶砖", "total_price": 273.05}, {"num": 1, "price": 227.54, "unit_id": 0, "goods_id": 871, "goods_name": "小青砖茶砖", "total_price": 227.54}, {"num": 1, "price": 204.79, "unit_id": 0, "goods_id": 869, "goods_name": "青砖碎茶", "total_price": 204.79}, {"num": 1, "price": 477.83, "unit_id": 0, "goods_id": 867, "goods_name": "5g/青砖袋泡茶", "total_price": 477.83}, {"num": 1, "price": 204.79, "unit_id": 0, "goods_id": 868, "goods_name": "16g青砖袋泡茶", "total_price": 204.79}]	从saas.mzth.cn导入 原单号:CG0003427	0	0		0		2026-03-30 16:55:58.353101	2026-03-30 17:17:13.885818
89	CG202603309957	CG202603304868	97			2026-01-01	0.00	0.00	0.00	[{"num": 10, "price": 10, "unit_id": 0, "goods_id": 920, "goods_name": "手工乌日末液体", "total_price": 100}, {"num": 36, "price": 10, "unit_id": 0, "goods_id": 970, "goods_name": "热奶豆腐碗", "total_price": 360}, {"num": 20, "price": 13, "unit_id": 0, "goods_id": 939, "goods_name": "半成品/透明/原味/鲜奶酪", "total_price": 260}, {"num": 52, "price": 13, "unit_id": 0, "goods_id": 940, "goods_name": "半成品/透明/甜味/鲜奶酪", "total_price": 676}]	从saas.mzth.cn导入 原单号:CG0003473	0	0		0		2026-03-30 16:55:57.063092	2026-03-30 17:17:17.904245
88	CG202603303366	CG202603309125	97			2026-01-03	0.00	0.00	0.00	[{"num": 10, "price": 6, "unit_id": 0, "goods_id": 866, "goods_name": "酸奶/纯净", "total_price": 60}]	从saas.mzth.cn导入 原单号:CG0003504	0	0		0		2026-03-30 16:55:56.440925	2026-03-30 17:17:18.466316
87	CG202603304558	CG202603301746	88			2026-01-03	0.00	0.00	0.00	[{"num": 20, "price": 49, "unit_id": 0, "goods_id": 865, "goods_name": "牛肉干/和希格图", "total_price": 980}]	从saas.mzth.cn导入 原单号:CG0003505	0	0		0		2026-03-30 16:55:55.803041	2026-03-30 17:17:19.541044
86	CG202603304678	CG202603309762	98			2026-01-06	0.00	0.00	0.00	[{"num": 10, "price": 22, "unit_id": 0, "goods_id": 981, "goods_name": "烤奶皮", "total_price": 220}]	从saas.mzth.cn导入 原单号:CG0003544	0	0		0		2026-03-30 16:55:55.096545	2026-03-30 17:17:21.494063
85	CG202603303318	CG202603306321	117			2026-01-06	0.00	0.00	0.00	[{"num": 53.4, "price": 15.99251, "unit_id": 0, "goods_id": 1014, "goods_name": "散装/甜味奶条", "total_price": 854}]	从saas.mzth.cn导入 原单号:CG0003546	0	0		0		2026-03-30 16:55:54.411365	2026-03-30 17:17:25.36143
84	CG202603307788	CG202603307886	98			2026-01-07	0.00	0.00	0.00	[{"num": 1, "price": 48, "unit_id": 0, "goods_id": 923, "goods_name": "炒米/散装/硬口", "total_price": 48}, {"num": 10, "price": 22, "unit_id": 0, "goods_id": 981, "goods_name": "烤奶皮", "total_price": 220}, {"num": 3, "price": 85, "unit_id": 0, "goods_id": 908, "goods_name": "哈斯乌拉牛肉干500g原味", "total_price": 255}, {"num": 2, "price": 95, "unit_id": 0, "goods_id": 907, "goods_name": "风干牛肉500g大片", "total_price": 190}]	从saas.mzth.cn导入 原单号:CG0003599	0	0		0		2026-03-30 16:55:53.757001	2026-03-30 17:17:26.161137
83	CG202603304139	CG202603309625	108			2026-01-09	0.00	0.00	0.00	[{"num": 10, "price": 68.7, "unit_id": 0, "goods_id": 997, "goods_name": "茶专用/盐包", "total_price": 687}]	从saas.mzth.cn导入 原单号:CG0003666	0	0		0		2026-03-30 16:55:53.020931	2026-03-30 17:17:27.617018
82	CG202603301334	CG202603309080	105			2026-01-09	0.00	0.00	0.00	[{"num": 119, "price": 30.69748, "unit_id": 0, "goods_id": 991, "goods_name": "奶果子/散装", "total_price": 3653}]	从saas.mzth.cn导入 原单号:CG0003667	0	0		0		2026-03-30 16:55:52.330284	2026-03-30 17:17:29.155542
81	CG202603306567	CG202603306230	97			2026-01-01	0.00	0.00	0.00	[{"num": 21, "price": 12, "unit_id": 0, "goods_id": 944, "goods_name": "半成品/透明/奶皮千层", "total_price": 252}, {"num": 10, "price": 15, "unit_id": 0, "goods_id": 885, "goods_name": "冻炒米/散装", "total_price": 150}, {"num": 100, "price": 0.224, "unit_id": 0, "goods_id": 863, "goods_name": "冻炒米/小包散/精品", "total_price": 22.4}]	从saas.mzth.cn导入 原单号:CG0003668	0	0		0		2026-03-30 16:55:51.696831	2026-03-30 17:17:30.672748
93	CG202603306251	CG202603306009	117			2025-12-28	0.00	0.00	0.00	[{"num": 18.8, "price": 16.5, "unit_id": 0, "goods_id": 1014, "goods_name": "散装/甜味奶条", "total_price": 310.2}]	从saas.mzth.cn导入 原单号:CG0003398	0	0		0		2026-03-30 16:56:00.197649	2026-03-30 17:20:49.431437
108	CG202603304003	CG202603306504	117			2025-12-16	0.00	0.00	0.00	[{"num": 23, "price": 8, "unit_id": 0, "goods_id": 1014, "goods_name": "散装/甜味奶条", "total_price": 184}]	从saas.mzth.cn导入 原单号:CG0003056	0	0		0		2026-03-30 16:56:10.031646	2026-03-30 17:10:46.908274
107	CG202603303087	CG202603307049	116			2025-12-16	0.00	0.00	0.00	[{"num": 12, "price": 18, "unit_id": 0, "goods_id": 1015, "goods_name": "散装/原味奶条", "total_price": 216}]	从saas.mzth.cn导入 原单号:CG0003057	0	0		0		2026-03-30 16:56:09.409839	2026-03-30 17:10:47.530706
106	CG202603303774	CG202603305009	93			2025-12-17	0.00	0.00	0.00	[{"num": 12, "price": 12, "unit_id": 0, "goods_id": 890, "goods_name": "红枣", "total_price": 144}]	从saas.mzth.cn导入 原单号:CG0003074	0	0		0		2026-03-30 16:56:08.741967	2026-03-30 17:10:49.213519
105	CG202603301479	CG202603309645	97			2025-12-17	0.00	0.00	0.00	[{"num": 17, "price": 14.5, "unit_id": 0, "goods_id": 973, "goods_name": "精品/奶豆腐块儿/甜味/", "total_price": 246.5}, {"num": 50, "price": 14.5, "unit_id": 0, "goods_id": 986, "goods_name": "精品/奶豆腐块儿/原味", "total_price": 725}]	从saas.mzth.cn导入 原单号:CG0003075	0	0		0		2026-03-30 16:56:08.120144	2026-03-30 17:10:49.777461
104	CG202603304110	CG202603305768	98			2025-12-17	0.00	0.00	0.00	[{"num": 20, "price": 14, "unit_id": 0, "goods_id": 916, "goods_name": "脆奶条/散装/科尔沁", "total_price": 280}, {"num": 7, "price": 15, "unit_id": 0, "goods_id": 889, "goods_name": "奶皮卷/科尔沁", "total_price": 105}, {"num": 2, "price": 7, "unit_id": 0, "goods_id": 886, "goods_name": "冻炒米/科尔沁", "total_price": 14}, {"num": 4, "price": 25, "unit_id": 0, "goods_id": 887, "goods_name": "羊乳奶粉/奶茶专用", "total_price": 100}, {"num": 4, "price": 14, "unit_id": 0, "goods_id": 888, "goods_name": "河套奶粉", "total_price": 56}]	从saas.mzth.cn导入 原单号:CG0003078	0	0		0		2026-03-30 16:56:07.257546	2026-03-30 17:10:54.215875
103	CG202603308380	CG202603302056	92			2025-12-19	0.00	0.00	0.00	[{"num": 13.25, "price": 16, "unit_id": 0, "goods_id": 885, "goods_name": "冻炒米/散装", "total_price": 212}, {"num": 5, "price": 12, "unit_id": 0, "goods_id": 884, "goods_name": "实惠/奶豆腐", "total_price": 60}, {"num": 10, "price": 8, "unit_id": 0, "goods_id": 924, "goods_name": "冻炒米/袋装", "total_price": 80}]	从saas.mzth.cn导入 原单号:CG0003106	0	0		0		2026-03-30 16:56:06.603788	2026-03-30 17:10:54.688379
102	CG202603306842	CG202603304036	97			2025-12-21	0.00	0.00	0.00	[{"num": 25, "price": 13, "unit_id": 0, "goods_id": 945, "goods_name": "半成品/透明/奶皮卷", "total_price": 325}]	从saas.mzth.cn导入 原单号:CG0003139	0	0		0		2026-03-30 16:56:05.967429	2026-03-30 17:10:55.941916
101	CG202603304156	CG202603307665	98			2025-12-24	0.00	0.00	0.00	[{"num": 10, "price": 15, "unit_id": 0, "goods_id": 889, "goods_name": "奶皮卷/科尔沁", "total_price": 150}]	从saas.mzth.cn导入 原单号:CG0003217	0	0		0		2026-03-30 16:56:05.342467	2026-03-30 17:16:54.16985
100	CG202603302512	CG202603301046	98			2025-12-25	0.00	0.00	0.00	[{"num": 9, "price": 10, "unit_id": 0, "goods_id": 884, "goods_name": "实惠/奶豆腐", "total_price": 90}, {"num": 10, "price": 5, "unit_id": 0, "goods_id": 920, "goods_name": "手工乌日末液体", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0003253	0	0		0		2026-03-30 16:56:04.710645	2026-03-30 17:16:56.87597
98	CG202603304010	CG202603301662	97			2025-12-25	0.00	0.00	0.00	[{"num": 40, "price": 14, "unit_id": 0, "goods_id": 946, "goods_name": "半成品/透明/鲜奶皮", "total_price": 560}, {"num": 50, "price": 13, "unit_id": 0, "goods_id": 945, "goods_name": "半成品/透明/奶皮卷", "total_price": 650}, {"num": 20, "price": 12, "unit_id": 0, "goods_id": 944, "goods_name": "半成品/透明/奶皮千层", "total_price": 240}, {"num": 35, "price": 6, "unit_id": 0, "goods_id": 974, "goods_name": "纯净黄油/瓶装好的", "total_price": 210}, {"num": 10, "price": 22, "unit_id": 0, "goods_id": 899, "goods_name": "纯净/黄油/斤", "total_price": 220}, {"num": 4, "price": 10, "unit_id": 0, "goods_id": 920, "goods_name": "手工乌日末液体", "total_price": 40}, {"num": 30, "price": 13, "unit_id": 0, "goods_id": 968, "goods_name": "大/奶皮", "total_price": 390}]	从saas.mzth.cn导入 原单号:CG0003286	0	0		0		2026-03-30 16:56:03.391096	2026-03-30 17:17:01.768302
123	CG202603309526	CG202603302561	98			2025-12-09	0.00	0.00	0.00	[{"num": 1, "price": 48, "unit_id": 0, "goods_id": 923, "goods_name": "炒米/散装/硬口", "total_price": 48}]	从saas.mzth.cn导入 原单号:CG0002908	0	0		0		2026-03-30 16:56:20.371772	2026-03-30 17:10:37.473198
122	CG202603304493	CG202603307582	98			2025-12-09	0.00	0.00	0.00	[{"num": 1, "price": 10, "unit_id": 0, "goods_id": 922, "goods_name": "酸奶炒米糖/散装", "total_price": 10}, {"num": 1, "price": 15, "unit_id": 0, "goods_id": 921, "goods_name": "嚼口脆炒米糖/散装", "total_price": 15}]	从saas.mzth.cn导入 原单号:CG0002913	0	0		0		2026-03-30 16:56:19.758158	2026-03-30 17:10:38.166998
121	CG202603309466	CG202603308804	98			2025-12-09	0.00	0.00	0.00	[{"num": 2, "price": 95, "unit_id": 0, "goods_id": 907, "goods_name": "风干牛肉500g大片", "total_price": 190}, {"num": 2, "price": 83, "unit_id": 0, "goods_id": 908, "goods_name": "哈斯乌拉牛肉干500g原味", "total_price": 166}, {"num": 2, "price": 7, "unit_id": 0, "goods_id": 909, "goods_name": "蓝旗绿乳糖惠虹糖", "total_price": 14}, {"num": 2, "price": 4, "unit_id": 0, "goods_id": 910, "goods_name": "蓝旗绿乳糖奶香酥", "total_price": 8}, {"num": 2, "price": 4, "unit_id": 0, "goods_id": 911, "goods_name": "蓝旗绿乳糖果仁酥", "total_price": 8}, {"num": 2, "price": 4, "unit_id": 0, "goods_id": 912, "goods_name": "蓝旗绿乳糖水果", "total_price": 8}, {"num": 2, "price": 4, "unit_id": 0, "goods_id": 913, "goods_name": "蓝旗绿乳糖黄油球", "total_price": 8}, {"num": 2, "price": 4, "unit_id": 0, "goods_id": 914, "goods_name": "蓝旗绿乳糖炼乳", "total_price": 8}, {"num": 1, "price": 15, "unit_id": 0, "goods_id": 921, "goods_name": "嚼口脆炒米糖/散装", "total_price": 15}, {"num": 1, "price": 10, "unit_id": 0, "goods_id": 922, "goods_name": "酸奶炒米糖/散装", "total_price": 10}, {"num": 4, "price": 8, "unit_id": 0, "goods_id": 915, "goods_name": "黄油渣/盒", "total_price": 32}, {"num": 10, "price": 14, "unit_id": 0, "goods_id": 916, "goods_name": "脆奶条/散装/科尔沁", "total_price": 140}, {"num": 2, "price": 17, "unit_id": 0, "goods_id": 905, "goods_name": "真空奶豆腐砖/甜味", "total_price": 34}, {"num": 2, "price": 17, "unit_id": 0, "goods_id": 906, "goods_name": "真空奶豆腐砖/原味", "total_price": 34}, {"num": 2, "price": 19, "unit_id": 0, "goods_id": 903, "goods_name": "盛宇燃奶豆腐/甜味", "total_price": 38}, {"num": 2, "price": 19, "unit_id": 0, "goods_id": 904, "goods_name": "盛宇燃奶豆腐/原味", "total_price": 38}]	从saas.mzth.cn导入 原单号:CG0002914	0	0		0		2026-03-30 16:56:19.145174	2026-03-30 17:10:38.902238
119	CG202603302598	CG202603304114	116			2025-10-20	0.00	0.00	0.00	[{"num": 9.2, "price": 9, "unit_id": 0, "goods_id": 1015, "goods_name": "散装/原味奶条", "total_price": 82.8}]	从saas.mzth.cn导入 原单号:CG0002951	0	0		0		2026-03-30 16:56:17.9106	2026-03-30 17:10:40.193908
118	CG202603307319	CG202603308738	116			2025-12-10	0.00	0.00	0.00	[{"num": 30.8, "price": 18, "unit_id": 0, "goods_id": 1015, "goods_name": "散装/原味奶条", "total_price": 554.4}]	从saas.mzth.cn导入 原单号:CG0002952	0	0		0		2026-03-30 16:56:17.297514	2026-03-30 17:10:40.689154
117	CG202603302833	CG202603309609	115			2025-12-10	0.00	0.00	0.00	[{"num": 100, "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 550}]	从saas.mzth.cn导入 原单号:CG0002953	0	0		0		2026-03-30 16:56:16.611387	2026-03-30 17:10:42.082893
116	CG202603304964	CG202603307732	121			2025-12-10	0.00	0.00	0.00	[{"num": 500, "price": 0.321, "unit_id": 0, "goods_id": 900, "goods_name": "透专标签/脆香奶条/微甜", "total_price": 160.5}, {"num": 500, "price": 0.321, "unit_id": 0, "goods_id": 950, "goods_name": "透专标签/奶皮卷", "total_price": 160.5}, {"num": 500, "price": 0.321, "unit_id": 0, "goods_id": 951, "goods_name": "透专标签/冻炒米", "total_price": 160.5}, {"num": 500, "price": 0.321, "unit_id": 0, "goods_id": 952, "goods_name": "透专标签/奶酪/原味", "total_price": 160.5}, {"num": 500, "price": 0.321, "unit_id": 0, "goods_id": 953, "goods_name": "透专标签/奶酪/甜味", "total_price": 160.5}, {"num": 500, "price": 0.321, "unit_id": 0, "goods_id": 956, "goods_name": "透专标签/鲜奶皮", "total_price": 160.5}]	从saas.mzth.cn导入 原单号:CG0002955	0	0		0		2026-03-30 16:56:15.979293	2026-03-30 17:10:42.545849
115	CG202603308108	CG202603307279	112			2025-12-10	0.00	0.00	0.00	[{"num": 20, "price": 169, "unit_id": 0, "goods_id": 1010, "goods_name": "奶油球", "total_price": 3380}]	从saas.mzth.cn导入 原单号:CG0002956	0	0		0		2026-03-30 16:56:15.348802	2026-03-30 17:10:43.01111
114	CG202603307196	CG202603306599	97			2025-12-12	0.00	0.00	0.00	[{"num": 6, "price": 22, "unit_id": 0, "goods_id": 899, "goods_name": "纯净/黄油/斤", "total_price": 132}, {"num": 10, "price": 14, "unit_id": 0, "goods_id": 945, "goods_name": "半成品/透明/奶皮卷", "total_price": 140}]	从saas.mzth.cn导入 原单号:CG0002992	0	0		0		2026-03-30 16:56:14.636299	2026-03-30 17:10:43.464788
113	CG202603307967	CG202603305775	115			2025-12-12	0.00	0.00	0.00	[{"num": 100, "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 550}]	从saas.mzth.cn导入 原单号:CG0002993	0	0		0		2026-03-30 16:56:13.170479	2026-03-30 17:10:43.937571
112	CG202603304219	CG202603304161	93			2025-12-10	0.00	0.00	0.00	[{"num": 6, "price": 3.5, "unit_id": 0, "goods_id": 929, "goods_name": "白砂糖", "total_price": 21}]	从saas.mzth.cn导入 原单号:CG0002994	0	0		0		2026-03-30 16:56:12.540091	2026-03-30 17:10:44.787931
111	CG202603304912	CG202603301476	92			2025-12-13	0.00	0.00	0.00	[{"num": 10, "price": 8, "unit_id": 0, "goods_id": 920, "goods_name": "手工乌日末液体", "total_price": 80}, {"num": 4, "price": 12, "unit_id": 0, "goods_id": 917, "goods_name": "机器乌日末液体", "total_price": 48}]	从saas.mzth.cn导入 原单号:CG0003007	0	0		0		2026-03-30 16:56:11.894322	2026-03-30 17:10:45.436652
110	CG202603304160	CG202603308040	98			2025-12-14	0.00	0.00	0.00	[{"num": 5, "price": 22, "unit_id": 0, "goods_id": 902, "goods_name": "乌日莫糖/散装", "total_price": 110}, {"num": 5, "price": 15, "unit_id": 0, "goods_id": 921, "goods_name": "嚼口脆炒米糖/散装", "total_price": 75}, {"num": 5, "price": 10, "unit_id": 0, "goods_id": 922, "goods_name": "酸奶炒米糖/散装", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0003015	0	0		0		2026-03-30 16:56:11.266755	2026-03-30 17:10:45.926378
130	CG202603306631	CG202603308970	121			2025-12-04	0.00	0.00	0.00	[{"num": 20000, "price": 0.0265, "unit_id": 0, "goods_id": 979, "goods_name": "新茶包/纸", "total_price": 530}, {"num": 500, "price": 0.0682, "unit_id": 0, "goods_id": 1020, "goods_name": "标签/不干胶/奶果子", "total_price": 34.1}, {"num": 500, "price": 0.05137, "unit_id": 0, "goods_id": 950, "goods_name": "透专标签/奶皮卷", "total_price": 25.69}, {"num": 500, "price": 0.05137, "unit_id": 0, "goods_id": 951, "goods_name": "透专标签/冻炒米", "total_price": 25.69}, {"num": 500, "price": 0.05137, "unit_id": 0, "goods_id": 952, "goods_name": "透专标签/奶酪/原味", "total_price": 25.69}, {"num": 500, "price": 0.05137, "unit_id": 0, "goods_id": 953, "goods_name": "透专标签/奶酪/甜味", "total_price": 25.69}, {"num": 500, "price": 0.05137, "unit_id": 0, "goods_id": 954, "goods_name": "透专标签/乳清奶条/甜味", "total_price": 25.69}, {"num": 500, "price": 0.05137, "unit_id": 0, "goods_id": 955, "goods_name": "透专标签/乳清奶条/原味", "total_price": 25.69}, {"num": 500, "price": 0.05137, "unit_id": 0, "goods_id": 956, "goods_name": "透专标签/鲜奶皮", "total_price": 25.69}]	从saas.mzth.cn导入 原单号:CG0002855	0	0		0		2026-03-30 16:56:24.776855	2026-03-30 17:10:33.336485
129	CG202603306178	CG202603301099	101			2025-12-05	0.00	0.00	0.00	[{"num": 100, "price": 0.7882, "unit_id": 0, "goods_id": 949, "goods_name": "专袋/乌日莫/炒米", "total_price": 78.82}, {"num": 100, "price": 0.458, "unit_id": 0, "goods_id": 948, "goods_name": "专袋/乌日莫", "total_price": 45.8}]	从saas.mzth.cn导入 原单号:CG0002856	0	0		0		2026-03-30 16:56:24.154006	2026-03-30 17:10:33.795384
128	CG202603306825	CG202603301595	115			2025-12-05	0.00	0.00	0.00	[{"num": 40, "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 220}]	从saas.mzth.cn导入 原单号:CG0002857	0	0		0		2026-03-30 16:56:23.530431	2026-03-30 17:10:34.257756
127	CG202603301390	CG202603306779	98			2025-12-05	0.00	0.00	0.00	[{"num": 5, "price": 12, "unit_id": 0, "goods_id": 930, "goods_name": "加沙奶豆腐", "total_price": 60}, {"num": 10, "price": 4.8, "unit_id": 0, "goods_id": 931, "goods_name": "炒米粉/aag", "total_price": 48}, {"num": 10, "price": 5.8, "unit_id": 0, "goods_id": 932, "goods_name": "炒米海丰", "total_price": 58}]	从saas.mzth.cn导入 原单号:CG0002863	0	0		0		2026-03-30 16:56:22.93233	2026-03-30 17:10:34.719254
126	CG202603301463	CG202603302962	93			2025-12-05	0.00	0.00	0.00	[{"num": 2, "price": 3.5, "unit_id": 0, "goods_id": 929, "goods_name": "白砂糖", "total_price": 7}, {"num": 1, "price": 90, "unit_id": 0, "goods_id": 1002, "goods_name": "封口机/真空", "total_price": 90}, {"num": 300, "price": 0.03333, "unit_id": 0, "goods_id": 928, "goods_name": "塑料购物袋", "total_price": 10}]	从saas.mzth.cn导入 原单号:CG0002864	0	0		0		2026-03-30 16:56:22.332405	2026-03-30 17:10:35.187103
124	CG202603308697	CG202603305896	92			2025-12-07	0.00	0.00	0.00	[{"num": 5, "price": 8, "unit_id": 0, "goods_id": 924, "goods_name": "冻炒米/袋装", "total_price": 40}, {"num": 2, "price": 9, "unit_id": 0, "goods_id": 917, "goods_name": "机器乌日末液体", "total_price": 18}, {"num": 10, "price": 8, "unit_id": 0, "goods_id": 920, "goods_name": "手工乌日末液体", "total_price": 80}, {"num": 2, "price": 11, "unit_id": 0, "goods_id": 918, "goods_name": "黄油/半斤", "total_price": 22}, {"num": 4, "price": 20, "unit_id": 0, "goods_id": 919, "goods_name": "黄油/斤", "total_price": 80}]	从saas.mzth.cn导入 原单号:CG0002900	0	0		0		2026-03-30 16:56:21.014621	2026-03-30 17:10:36.284618
480	CG202603311612	CG202603312351	107	拼多多/木勺	牧区纯坊官方品牌	2025-10-01	63.96	0.00	0.00	[{"num": 2, "spec": "袋100个/平均价0.1599", "price": 15.99, "unit_id": 0, "goods_id": 1000, "goods_sn": "SP0000034", "unit_name": "捆", "goods_name": "木勺", "total_price": 31.98}, {"num": 200, "spec": "袋100个/平均价0.1599", "price": 0.1599, "unit_id": 0, "goods_id": 1000, "goods_sn": "SP0000034", "unit_name": "个", "goods_name": "木勺", "total_price": 31.98}]	从saas.mzth.cn导入 原单号:CG0002153	0	0		0		2026-03-31 02:38:41.521069	\N
402	CG202603313512	CG202603317188	113	永巨茶业	牧区纯坊官方品牌	2025-12-29	1388.00	0.00	0.00	[{"num": 1, "spec": "1.5kg", "price": 273.05, "unit_id": 0, "goods_id": 870, "goods_sn": "SP0000165", "unit_name": "件", "goods_name": "大青砖茶砖", "total_price": 273.05}, {"num": 1, "spec": "380g", "price": 227.54, "unit_id": 0, "goods_id": 871, "goods_sn": "SP0000164", "unit_name": "件", "goods_name": "小青砖茶砖", "total_price": 227.54}, {"num": 1, "spec": "450g", "price": 204.79, "unit_id": 0, "goods_id": 869, "goods_sn": "SP0000166", "unit_name": "件", "goods_name": "青砖碎茶", "total_price": 204.79}, {"num": 1, "spec": "5g/袋泡茶/30泡", "price": 477.83, "unit_id": 0, "goods_id": 867, "goods_sn": "SP0000168", "unit_name": "件", "goods_name": "5g/青砖袋泡茶", "total_price": 477.83}, {"num": 1, "spec": "450g/25袋", "price": 204.79, "unit_id": 0, "goods_id": 868, "goods_sn": "SP0000167", "unit_name": "件", "goods_name": "16g青砖袋泡茶", "total_price": 204.79}]	从saas.mzth.cn导入 原单号:CG0003427	0	0		0		2026-03-31 02:35:53.943099	\N
147	CG202603303986	CG202603305447	108			2025-11-01	0.00	0.00	0.00	[{"num": 3560, "price": 0.068, "unit_id": 0, "goods_id": 997, "goods_name": "茶专用/盐包", "total_price": 242.08}]	从saas.mzth.cn导入 原单号:CG0002475	0	0		0		2026-03-30 16:56:36.165791	2026-03-30 17:10:24.885343
146	CG202603309355	CG202603305759	112			2025-11-07	0.00	0.00	0.00	[{"num": 10, "price": 181.7, "unit_id": 0, "goods_id": 1010, "goods_name": "奶油球", "total_price": 1817}]	从saas.mzth.cn导入 原单号:CG0002603	0	0		0		2026-03-30 16:56:35.462294	2026-03-30 17:10:25.350679
145	CG202603304910	CG202603303751	117			2025-11-16	0.00	0.00	0.00	[{"num": 21, "price": 17, "unit_id": 0, "goods_id": 1014, "goods_name": "散装/甜味奶条", "total_price": 357}]	从saas.mzth.cn导入 原单号:CG0002604	0	0		0		2026-03-30 16:56:34.829831	2026-03-30 17:10:25.798103
144	CG202603302078	CG202603307321	107			2025-11-16	0.00	0.00	0.00	[{"num": 10, "price": 15.99, "unit_id": 0, "goods_id": 1000, "goods_name": "木勺", "total_price": 159.9}]	从saas.mzth.cn导入 原单号:CG0002605	0	0		0		2026-03-30 16:56:34.219107	2026-03-30 17:10:26.262315
143	CG202603308689	CG202603306832	106			2025-11-16	0.00	0.00	0.00	[{"num": 2600, "price": 0.09442, "unit_id": 0, "goods_id": 995, "goods_name": "茶专用/热缩膜", "total_price": 245.49}]	从saas.mzth.cn导入 原单号:CG0002606	0	0		0		2026-03-30 16:56:33.488077	2026-03-30 17:10:26.743576
142	CG202603309457	CG202603306542	101			2025-11-16	0.00	0.00	0.00	[{"num": 1, "price": 38, "unit_id": 0, "goods_id": 1002, "goods_name": "封口机/真空", "total_price": 38}]	从saas.mzth.cn导入 原单号:CG0002607	0	0		0		2026-03-30 16:56:32.359947	2026-03-30 17:10:27.252997
141	CG202603306935	CG202603303477	101			2025-11-16	0.00	0.00	0.00	[{"num": 1, "price": 2800, "unit_id": 0, "goods_id": 1001, "goods_name": "冷冻柜/冰箱", "total_price": 2800}]	从saas.mzth.cn导入 原单号:CG0002608	0	0		0		2026-03-30 16:56:31.737784	2026-03-30 17:10:27.817345
140	CG202603309626	CG202603307597	121			2025-11-16	0.00	0.00	0.00	[{"num": 500, "price": 0.0578, "unit_id": 0, "goods_id": 1019, "goods_name": "标签/不干胶/冻炒米", "total_price": 28.9}, {"num": 2000, "price": 0.181, "unit_id": 0, "goods_id": 984, "goods_name": "茶包/类腰封纸", "total_price": 362}, {"num": 500, "price": 0.0816, "unit_id": 0, "goods_id": 975, "goods_name": "黄油脖签", "total_price": 40.8}, {"num": 3000, "price": 0.05433, "unit_id": 0, "goods_id": 978, "goods_name": "新茶专用标签纸", "total_price": 162.99}]	从saas.mzth.cn导入 原单号:CG0002609	0	0		0		2026-03-30 16:56:31.123912	2026-03-30 17:10:28.343576
139	CG202603302918	CG202603309404	100			2025-11-16	0.00	0.00	0.00	[{"num": 25, "price": 0.72, "unit_id": 0, "goods_id": 983, "goods_name": "甜味/标签/不干胶/传统奶豆腐", "total_price": 18}, {"num": 25, "price": 0.72, "unit_id": 0, "goods_id": 1021, "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 18}, {"num": 60, "price": 1, "unit_id": 0, "goods_id": 999, "goods_name": "茶专用/不干胶/标签", "total_price": 60}]	从saas.mzth.cn导入 原单号:CG0002610	0	0		0		2026-03-30 16:56:30.502361	2026-03-30 17:10:28.84693
138	CG202603304376	CG202603304561	99			2025-12-01	0.00	0.00	0.00	[{"num": 5000, "price": 0.185, "unit_id": 0, "goods_id": 982, "goods_name": "塑料手提袋", "total_price": 925}]	从saas.mzth.cn导入 原单号:CG0002794	0	0		0		2026-03-30 16:56:29.875745	2026-03-30 17:10:29.349803
137	CG202603304282	CG202603308045	118			2025-12-01	0.00	0.00	0.00	[{"num": 240, "price": 1.8, "unit_id": 0, "goods_id": 1016, "goods_name": "专瓶/黄油", "total_price": 432}, {"num": 120, "price": 1.8, "unit_id": 0, "goods_id": 862, "goods_name": "专瓶/黄油渣", "total_price": 216}]	从saas.mzth.cn导入 原单号:CG0002797	0	0		0		2026-03-30 16:56:29.247194	2026-03-30 17:10:29.809102
136	CG202603304975	CG202603303073	105			2025-11-30	0.00	0.00	0.00	[{"num": 85.84, "price": 25, "unit_id": 0, "goods_id": 991, "goods_name": "奶果子/散装", "total_price": 2146}]	从saas.mzth.cn导入 原单号:CG0002800	0	0		0		2026-03-30 16:56:28.625294	2026-03-30 17:10:30.430008
135	CG202603307278	CG202603309195	120			2025-12-01	0.00	0.00	0.00	[{"num": 500, "price": 0.1408, "unit_id": 0, "goods_id": 1027, "goods_name": "真空袋", "total_price": 70.4}]	从saas.mzth.cn导入 原单号:CG0002801	0	0		0		2026-03-30 16:56:28.005331	2026-03-30 17:10:30.882107
134	CG202603305716	CG202603306882	98			2025-12-04	0.00	0.00	0.00	[{"num": 7, "price": 22, "unit_id": 0, "goods_id": 981, "goods_name": "烤奶皮", "total_price": 154}]	从saas.mzth.cn导入 原单号:CG0002847	0	0		0		2026-03-30 16:56:27.337258	2026-03-30 17:10:31.464171
169	CG202603302848	CG202603306925	117			2025-10-12	0.00	0.00	0.00	[{"num": 16.41, "price": 16, "unit_id": 0, "goods_id": 1014, "goods_name": "散装/甜味奶条", "total_price": 262.56}, {"num": 10, "price": 16, "unit_id": 0, "goods_id": 1014, "goods_name": "散装/甜味奶条", "total_price": 160}]	从saas.mzth.cn导入 原单号:CG0002021	0	0		0		2026-03-30 16:56:53.125714	2026-03-30 17:10:13.045085
168	CG202603307158	CG202603306927	116			2025-10-10	0.00	0.00	0.00	[{"num": 15, "price": 18, "unit_id": 0, "goods_id": 1015, "goods_name": "散装/原味奶条", "total_price": 270}]	从saas.mzth.cn导入 原单号:CG0002022	0	0		0		2026-03-30 16:56:52.505411	2026-03-30 17:10:13.534835
167	CG202603307731	CG202603302141	115			2025-10-12	0.00	0.00	0.00	[{"num": 30, "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 165}]	从saas.mzth.cn导入 原单号:CG0002023	0	0		0		2026-03-30 16:56:51.078328	2026-03-30 17:10:14.037908
166	CG202603302280	CG202603307718	113			2025-10-06	0.00	0.00	0.00	[{"num": 8, "price": 353.13, "unit_id": 0, "goods_id": 1011, "goods_name": "茶包", "total_price": 2825.04}]	从saas.mzth.cn导入 原单号:CG0002026	0	0		0		2026-03-30 16:56:50.441082	2026-03-30 17:10:14.515407
165	CG202603309200	CG202603303559	112			2025-10-09	0.00	0.00	0.00	[{"num": 8, "price": 181.875, "unit_id": 0, "goods_id": 1010, "goods_name": "奶油球", "total_price": 1455}]	从saas.mzth.cn导入 原单号:CG0002027	0	0		0		2026-03-30 16:56:49.806017	2026-03-30 17:10:15.099579
164	CG202603309394	CG202603302480	111			2025-10-11	0.00	0.00	0.00	[{"num": 3030, "price": 2.47525, "unit_id": 0, "goods_id": 1009, "goods_name": "专盒/青砖奶茶外盒", "total_price": 7500.01}]	从saas.mzth.cn导入 原单号:CG0002028	0	0		0		2026-03-30 16:56:49.193735	2026-03-30 17:10:15.615128
163	CG202603303096	CG202603305459	110			2025-10-22	0.00	0.00	0.00	[{"num": 1, "price": 1700, "unit_id": 0, "goods_id": 1003, "goods_name": "热收缩膜机", "total_price": 1700}]	从saas.mzth.cn导入 原单号:CG0002151	0	0		0		2026-03-30 16:56:48.571641	2026-03-30 17:10:16.124144
162	CG202603303443	CG202603305790	108			2025-10-01	0.00	0.00	0.00	[{"num": 2, "price": 68.75, "unit_id": 0, "goods_id": 997, "goods_name": "茶专用/盐包", "total_price": 137.5}, {"num": 200, "price": 0.068, "unit_id": 0, "goods_id": 997, "goods_name": "茶专用/盐包", "total_price": 13.6}]	从saas.mzth.cn导入 原单号:CG0002152	0	0		0		2026-03-30 16:56:47.581151	2026-03-30 17:10:16.603261
161	CG202603307166	CG202603308680	107			2025-10-01	0.00	0.00	0.00	[{"num": 2, "price": 15.99, "unit_id": 0, "goods_id": 1000, "goods_name": "木勺", "total_price": 31.98}, {"num": 200, "price": 0.1599, "unit_id": 0, "goods_id": 1000, "goods_name": "木勺", "total_price": 31.98}]	从saas.mzth.cn导入 原单号:CG0002153	0	0		0		2026-03-30 16:56:46.072085	2026-03-30 17:10:17.071298
160	CG202603308444	CG202603303547	121			2025-10-01	0.00	0.00	0.00	[{"num": 1000, "price": 0.32, "unit_id": 0, "goods_id": 998, "goods_name": "茶专用/硫酸纸", "total_price": 320}, {"num": 1000, "price": 0.04, "unit_id": 0, "goods_id": 999, "goods_name": "茶专用/不干胶/标签", "total_price": 40}]	从saas.mzth.cn导入 原单号:CG0002154	0	0		0		2026-03-30 16:56:45.213199	2026-03-30 17:10:17.622806
159	CG202603305345	CG202603309616	106			2025-10-01	0.00	0.00	0.00	[{"num": 10, "price": 10, "unit_id": 0, "goods_id": 995, "goods_name": "茶专用/热缩膜", "total_price": 100}]	从saas.mzth.cn导入 原单号:CG0002173	0	0		0		2026-03-30 16:56:44.442109	2026-03-30 17:10:18.090564
158	CG202603303111	CG202603302440	123			2025-10-01	0.00	0.00	0.00	[{"num": 200, "price": 2, "unit_id": 0, "goods_id": 1009, "goods_name": "专盒/青砖奶茶外盒", "total_price": 400}]	从saas.mzth.cn导入 原单号:CG0002174	0	0		0		2026-03-30 16:56:43.834656	2026-03-30 17:10:18.648715
157	CG202603308923	CG202603306326	106			2025-10-01	0.00	0.00	0.00	[{"num": 500, "price": 0.1, "unit_id": 0, "goods_id": 993, "goods_name": "冻炒米专用/塑膜袋", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0002175	0	0		0		2026-03-30 16:56:43.229954	2026-03-30 17:10:19.125083
156	CG202603302225	CG202603309679	105			2025-10-01	0.00	0.00	0.00	[{"num": 18.24, "price": 25, "unit_id": 0, "goods_id": 991, "goods_name": "奶果子/散装", "total_price": 456}]	从saas.mzth.cn导入 原单号:CG0002176	0	0		0		2026-03-30 16:56:42.618528	2026-03-30 17:10:19.618547
155	CG202603302448	CG202603301435	106			2025-10-01	0.00	0.00	0.00	[{"num": 1000, "price": 0.1, "unit_id": 0, "goods_id": 990, "goods_name": "奶果子/专用塑膜袋", "total_price": 100}]	从saas.mzth.cn导入 原单号:CG0002177	0	0		0		2026-03-30 16:56:41.959818	2026-03-30 17:10:20.116868
154	CG202603302547	CG202603301137	105			2025-10-01	0.00	0.00	0.00	[{"num": 14.4, "price": 25, "unit_id": 0, "goods_id": 991, "goods_name": "奶果子/散装", "total_price": 360}]	从saas.mzth.cn导入 原单号:CG0002178	0	0		0		2026-03-30 16:56:41.345702	2026-03-30 17:10:20.67801
153	CG202603304346	CG202603308580	112			2025-10-26	0.00	0.00	0.00	[{"num": 10, "price": 182, "unit_id": 0, "goods_id": 1010, "goods_name": "奶油球", "total_price": 1820}]	从saas.mzth.cn导入 原单号:CG0002219	0	0		0		2026-03-30 16:56:40.719167	2026-03-30 17:10:21.155911
152	CG202603309275	CG202603305628	104			2025-10-26	0.00	0.00	0.00	[{"num": 14, "price": 33.57143, "unit_id": 0, "goods_id": 987, "goods_name": "采购样品专用/乳制品", "total_price": 470}]	从saas.mzth.cn导入 原单号:CG0002220	0	0		0		2026-03-30 16:56:39.941112	2026-03-30 17:10:21.698305
151	CG202603305199	CG202603303943	114			2025-10-31	0.00	0.00	0.00	[{"num": 3, "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 16.5}]	从saas.mzth.cn导入 原单号:CG0002415	0	0		0		2026-03-30 16:56:39.327174	2026-03-30 17:10:22.304816
303	CG202603308462	CG202603303889	108	山东锦食食品	牧区纯坊官方品牌	2025-11-01	242.08	0.00	0.00	[{"num": 3560.0, "spec": "2g", "price": 0.068, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "小包", "goods_name": "茶专用/盐包", "total_price": 242.08}]	从saas.mzth.cn导入 原单号:CG0002475	0	0		0		2026-03-30 17:39:03.352861	2026-03-31 02:33:32.818788
181	CG202603304954	CG202603303144	120			2025-09-30	0.00	0.00	0.00	[{"num": 90, "price": 0.55, "unit_id": 0, "goods_id": 1022, "goods_name": "专袋/传统奶豆腐", "total_price": 49.5}]	从saas.mzth.cn导入 原单号:CG0002009	0	0		0		2026-03-30 16:57:05.530868	2026-03-30 17:10:06.405771
179	CG202603308954	CG202603309398	121			2025-09-30	0.00	0.00	0.00	[{"num": 13, "price": 0.03, "unit_id": 0, "goods_id": 1020, "goods_name": "标签/不干胶/奶果子", "total_price": 0.39}]	从saas.mzth.cn导入 原单号:CG0002011	0	0		0		2026-03-30 16:57:01.769902	2026-03-30 17:10:07.583607
178	CG202603307032	CG202603307690	121			2025-09-30	0.00	0.00	0.00	[{"num": 500, "price": 0.067, "unit_id": 0, "goods_id": 1019, "goods_name": "标签/不干胶/冻炒米", "total_price": 33.5}, {"num": 1650, "price": 0.87, "unit_id": 0, "goods_id": 1032, "goods_name": "专盒/冻炒米", "total_price": 1435.5}]	从saas.mzth.cn导入 原单号:CG0002012	0	0		0		2026-03-30 16:57:00.046179	2026-03-30 17:10:08.057248
177	CG202603304369	CG202603305140	119			2025-09-30	0.00	0.00	0.00	[{"num": 30, "price": 4.55, "unit_id": 0, "goods_id": 1018, "goods_name": "礼盒/蓝界", "total_price": 136.5}, {"num": 26, "price": 4.55, "unit_id": 0, "goods_id": 1018, "goods_name": "礼盒/蓝界", "total_price": 118.3}]	从saas.mzth.cn导入 原单号:CG0002013	0	0		0		2026-03-30 16:56:59.373168	2026-03-30 17:10:08.636703
175	CG202603308386	CG202603307195	123			2025-09-30	0.00	0.00	0.00	[{"num": 17, "price": 35.5, "unit_id": 0, "goods_id": 1033, "goods_name": "专袋/奶条", "total_price": 603.5}, {"num": 16, "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_name": "专袋/奶条", "total_price": 11.36}, {"num": 47, "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_name": "专袋/奶条", "total_price": 33.37}, {"num": 7, "price": 35.5, "unit_id": 0, "goods_id": 1033, "goods_name": "专袋/奶条", "total_price": 248.5}, {"num": 79, "price": 18.5, "unit_id": 0, "goods_id": 1031, "goods_name": "专底盒/奶条", "total_price": 1461.5}, {"num": 33, "price": 0.37, "unit_id": 0, "goods_id": 1031, "goods_name": "专底盒/奶条", "total_price": 12.21}, {"num": 6, "price": 0.65, "unit_id": 0, "goods_id": 1030, "goods_name": "专外盒/奶果子", "total_price": 3.9}, {"num": 34, "price": 32.5, "unit_id": 0, "goods_id": 1030, "goods_name": "专外盒/奶果子", "total_price": 1105}, {"num": 24, "price": 0.65, "unit_id": 0, "goods_id": 1029, "goods_name": "专内盒/奶果子", "total_price": 15.6}, {"num": 37, "price": 26, "unit_id": 0, "goods_id": 1029, "goods_name": "专内盒/奶果子", "total_price": 962}, {"num": 25, "price": 0.08, "unit_id": 0, "goods_id": 1026, "goods_name": "专内袋/奶果子", "total_price": 2}, {"num": 82, "price": 15.76, "unit_id": 0, "goods_id": 1026, "goods_name": "专内袋/奶果子", "total_price": 1292.32}]	从saas.mzth.cn导入 原单号:CG0002015	0	0		0		2026-03-30 16:56:57.608729	2026-03-30 17:10:09.676554
174	CG202603301000	CG202603303407	121			2025-09-30	0.00	0.00	0.00	[{"num": 748, "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 44.88}, {"num": 9, "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 0.54}, {"num": 260, "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 15.6}, {"num": 76, "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 4.56}, {"num": 18, "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 1.08}]	从saas.mzth.cn导入 原单号:CG0002016	0	0		0		2026-03-30 16:56:56.58486	2026-03-30 17:10:10.181978
173	CG202603309811	CG202603308914	120			2025-09-30	0.00	0.00	0.00	[{"num": 79, "price": 0.55, "unit_id": 0, "goods_id": 1022, "goods_name": "专袋/传统奶豆腐", "total_price": 43.45}, {"num": 23, "price": 0.55, "unit_id": 0, "goods_id": 1022, "goods_name": "专袋/传统奶豆腐", "total_price": 12.65}]	从saas.mzth.cn导入 原单号:CG0002017	0	0		0		2026-03-30 16:56:55.899114	2026-03-30 17:10:10.632171
172	CG202603302101	CG202603305507	120			2025-09-30	0.00	0.00	0.00	[{"num": 20, "price": 0.17, "unit_id": 0, "goods_id": 1027, "goods_name": "真空袋", "total_price": 3.4}]	从saas.mzth.cn导入 原单号:CG0002018	0	0		0		2026-03-30 16:56:55.038471	2026-03-30 17:10:11.205398
171	CG202603307041	CG202603307041	118			2025-09-30	0.00	0.00	0.00	[{"num": 55, "price": 1.62, "unit_id": 0, "goods_id": 1016, "goods_name": "专瓶/黄油", "total_price": 89.1}]	从saas.mzth.cn导入 原单号:CG0002019	0	0		0		2026-03-30 16:56:54.387197	2026-03-30 17:10:12.0733
320	CG202603302652	CG202603302158	111	优如包装	牧区纯坊官方品牌	2025-10-11	7500.01	0.00	0.00	[{"num": 3030.0, "spec": "1", "price": 2.47525, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专盒/青砖奶茶外盒", "total_price": 7500.01}]	从saas.mzth.cn导入 原单号:CG0002028	0	0		0		2026-03-30 17:39:21.272472	2026-03-31 02:33:23.709097
319	CG202603301607	CG202603308566	110	淘宝欧信	牧区纯坊官方品牌	2025-10-22	1700.00	0.00	0.00	[{"num": 1.0, "spec": "1", "price": 1700.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "台", "goods_name": "热收缩膜机", "total_price": 1700.0}]	从saas.mzth.cn导入 原单号:CG0002151	0	0		0		2026-03-30 17:39:20.292769	2026-03-31 02:33:24.202246
450	CG202603316610	CG202603311625	100	民族印刷厂	牧区纯坊官方品牌	2025-11-16	96.00	0.00	0.00	[{"num": 25, "spec": "1", "price": 0.72, "unit_id": 0, "goods_id": 983, "goods_sn": "SP0000051", "unit_name": "张", "goods_name": "甜味/标签/不干胶/传统奶豆腐", "total_price": 18}, {"num": 25, "spec": "1", "price": 0.72, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 18}, {"num": 60, "spec": "0", "price": 1, "unit_id": 0, "goods_id": 999, "goods_sn": "SP0000035", "unit_name": "张", "goods_name": "茶专用/不干胶/标签", "total_price": 60}]	从saas.mzth.cn导入 原单号:CG0002610	0	0		0		2026-03-31 02:37:56.434289	\N
190	CG202603307317	CG202603304999	123			2025-09-30	0.00	0.00	0.00	[{"num": 51, "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_name": "专袋/奶条", "total_price": 36.21}, {"num": 84, "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_name": "专袋/奶条", "total_price": 59.64}, {"num": 2, "price": 35.5, "unit_id": 0, "goods_id": 1033, "goods_name": "专袋/奶条", "total_price": 71}, {"num": 48, "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_name": "专袋/奶条", "total_price": 34.08}]	从saas.mzth.cn导入 原单号:CG0002000	0	0		0		2026-03-30 16:57:20.811372	2026-03-30 17:10:01.459798
189	CG202603306599	CG202603304333	121			2025-09-30	0.00	0.00	0.00	[{"num": 32, "price": 0.87, "unit_id": 0, "goods_id": 1032, "goods_name": "专盒/冻炒米", "total_price": 27.84}]	从saas.mzth.cn导入 原单号:CG0002001	0	0		0		2026-03-30 16:57:20.182453	2026-03-30 17:10:02.338546
188	CG202603304383	CG202603302938	123			2025-09-30	0.00	0.00	0.00	[{"num": 30, "price": 0.37, "unit_id": 0, "goods_id": 1031, "goods_name": "专底盒/奶条", "total_price": 11.1}, {"num": 3, "price": 18.5, "unit_id": 0, "goods_id": 1031, "goods_name": "专底盒/奶条", "total_price": 55.5}]	从saas.mzth.cn导入 原单号:CG0002002	0	0		0		2026-03-30 16:57:18.503848	2026-03-30 17:10:02.859397
187	CG202603308250	CG202603307848	123			2025-09-30	0.00	0.00	0.00	[{"num": 8, "price": 0.65, "unit_id": 0, "goods_id": 1029, "goods_name": "专内盒/奶果子", "total_price": 5.2}, {"num": 6, "price": 0.65, "unit_id": 0, "goods_id": 1030, "goods_name": "专外盒/奶果子", "total_price": 3.9}]	从saas.mzth.cn导入 原单号:CG0002003	0	0		0		2026-03-30 16:57:14.652825	2026-03-30 17:10:03.349539
186	CG202603301657	CG202603306782	121			2025-09-30	0.00	0.00	0.00	[{"num": 16, "price": 0.06, "unit_id": 0, "goods_id": 1028, "goods_name": "专标签/黄油", "total_price": 0.96}]	从saas.mzth.cn导入 原单号:CG0002004	0	0		0		2026-03-30 16:57:13.778646	2026-03-30 17:10:03.839872
185	CG202603309037	CG202603309335	120			2025-09-30	0.00	0.00	0.00	[{"num": 60, "price": 0.17, "unit_id": 0, "goods_id": 1027, "goods_name": "真空袋", "total_price": 10.2}]	从saas.mzth.cn导入 原单号:CG0002005	0	0		0		2026-03-30 16:57:11.196787	2026-03-30 17:10:04.30114
184	CG202603301943	CG202603308800	123			2025-09-30	0.00	0.00	0.00	[{"num": 16, "price": 0.08, "unit_id": 0, "goods_id": 1026, "goods_name": "专内袋/奶果子", "total_price": 1.28}, {"num": 13, "price": 15.76, "unit_id": 0, "goods_id": 1026, "goods_name": "专内袋/奶果子", "total_price": 204.88}]	从saas.mzth.cn导入 原单号:CG0002006	0	0		0		2026-03-30 16:57:10.476739	2026-03-30 17:10:04.8697
183	CG202603308074	CG202603303225	122			2025-09-30	0.00	0.00	0.00	[{"num": 16, "price": 0.07, "unit_id": 0, "goods_id": 1025, "goods_name": "定制款/专内袋/扎那家奶果子", "total_price": 1.12}, {"num": 170, "price": 14, "unit_id": 0, "goods_id": 1025, "goods_name": "定制款/专内袋/扎那家奶果子", "total_price": 2380}]	从saas.mzth.cn导入 原单号:CG0002007	0	0		0		2026-03-30 16:57:09.520425	2026-03-30 17:10:05.326914
325	CG202603308950	CG202603309233	117	巴音珠萨朗	牧区纯坊官方品牌	2025-10-12	422.56	0.00	0.00	[{"num": 16.41, "spec": "250克/一袋", "price": 16.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "散装/甜味奶条", "total_price": 262.56}, {"num": 10.0, "spec": "250克/一袋", "price": 16.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "散装/甜味奶条", "total_price": 160.0}]	从saas.mzth.cn导入 原单号:CG0002021	0	0		0		2026-03-30 17:39:26.010128	2026-03-31 02:33:20.266828
324	CG202603307260	CG202603302226	116	恩赫奶制品厂	牧区纯坊官方品牌	2025-10-10	270.00	0.00	0.00	[{"num": 15.0, "spec": "250克/一袋", "price": 18.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "散装/原味奶条", "total_price": 270.0}]	从saas.mzth.cn导入 原单号:CG0002022	0	0		0		2026-03-30 17:39:24.728748	2026-03-31 02:33:20.86054
323	CG202603307594	CG202603303776	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2025-10-12	165.00	0.00	0.00	[{"num": 30.0, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "盒", "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 165.0}]	从saas.mzth.cn导入 原单号:CG0002023	0	0		0		2026-03-30 17:39:23.784004	2026-03-31 02:33:21.341316
322	CG202603305868	CG202603309906	113	永巨茶业	牧区纯坊官方品牌	2025-10-06	2825.04	0.00	0.00	[{"num": 8.0, "spec": "1件2000包/300元/1件", "price": 353.13, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "件", "goods_name": "茶包", "total_price": 2825.04}]	从saas.mzth.cn导入 原单号:CG0002026	0	0		0		2026-03-30 17:39:22.935836	2026-03-31 02:33:21.855158
321	CG202603301876	CG202603302390	112	广州维记	牧区纯坊官方品牌	2025-10-09	1455.00	0.00	0.00	[{"num": 8.0, "spec": "400/箱/0.423/球", "price": 181.875, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "件", "goods_name": "奶油球", "total_price": 1455.0}]	从saas.mzth.cn导入 原单号:CG0002027	0	0		0		2026-03-30 17:39:22.10021	2026-03-31 02:33:22.768824
182	CG202603302690	CG202603307956	121			2025-09-30	0.00	0.00	0.00	[{"num": 77, "price": 0.05, "unit_id": 0, "goods_id": 1024, "goods_name": "标签/不干胶/奶条/甜味", "total_price": 3.85}, {"num": 27, "price": 0.05, "unit_id": 0, "goods_id": 1023, "goods_name": "标签/不干胶/奶条/原味", "total_price": 1.35}]	从saas.mzth.cn导入 原单号:CG0002008	0	0		0		2026-03-30 16:57:08.281023	2026-03-30 17:10:05.806407
180	CG202603304812	CG202603304748	121			2025-09-30	0.00	0.00	0.00	[{"num": 14, "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 0.84}, {"num": 15, "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 0.9}]	从saas.mzth.cn导入 原单号:CG0002010	0	0		0		2026-03-30 16:57:03.739103	2026-03-30 17:10:06.914585
176	CG202603303842	CG202603302995	123			2025-09-30	0.00	0.00	0.00	[{"num": 368, "price": 0.94, "unit_id": 0, "goods_id": 1017, "goods_name": "手提袋", "total_price": 345.92}, {"num": 80, "price": 35.5, "unit_id": 0, "goods_id": 1033, "goods_name": "专袋/奶条", "total_price": 2840}, {"num": 20, "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_name": "专袋/奶条", "total_price": 14.2}, {"num": 86, "price": 35.5, "unit_id": 0, "goods_id": 1033, "goods_name": "专袋/奶条", "total_price": 3053}, {"num": 5, "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_name": "专袋/奶条", "total_price": 3.55}, {"num": 17, "price": 18.5, "unit_id": 0, "goods_id": 1031, "goods_name": "专底盒/奶条", "total_price": 314.5}, {"num": 24, "price": 0.37, "unit_id": 0, "goods_id": 1031, "goods_name": "专底盒/奶条", "total_price": 8.88}]	从saas.mzth.cn导入 原单号:CG0002014	0	0		0		2026-03-30 16:56:58.656003	2026-03-30 17:10:09.107853
170	CG202603308003	CG202603309149	121			2025-09-30	0.00	0.00	0.00	[{"num": 36, "price": 0.87, "unit_id": 0, "goods_id": 1032, "goods_name": "专盒/冻炒米", "total_price": 31.32}, {"num": 20, "price": 43.5, "unit_id": 0, "goods_id": 1032, "goods_name": "专盒/冻炒米", "total_price": 870}, {"num": 298, "price": 0.05, "unit_id": 0, "goods_id": 1023, "goods_name": "标签/不干胶/奶条/原味", "total_price": 14.9}, {"num": 111, "price": 0.03, "unit_id": 0, "goods_id": 1020, "goods_name": "标签/不干胶/奶果子", "total_price": 3.33}, {"num": 340, "price": 0.06, "unit_id": 0, "goods_id": 1028, "goods_name": "专标签/黄油", "total_price": 20.4}, {"num": 500, "price": 0.06, "unit_id": 0, "goods_id": 1028, "goods_name": "专标签/黄油", "total_price": 30}, {"num": 10, "price": 0.05, "unit_id": 0, "goods_id": 1024, "goods_name": "标签/不干胶/奶条/甜味", "total_price": 0.5}]	从saas.mzth.cn导入 原单号:CG0002020	0	0		0		2026-03-30 16:56:53.750294	2026-03-30 17:10:12.595076
150	CG202603306484	CG202603307894	116			2025-10-20	0.00	0.00	0.00	[{"num": 15.8, "price": 18, "unit_id": 0, "goods_id": 1015, "goods_name": "散装/原味奶条", "total_price": 284.4}]	从saas.mzth.cn导入 原单号:CG0002417	0	0		0		2026-03-30 16:56:38.651138	2026-03-30 17:10:22.776538
149	CG202603307782	CG202603306402	108			2025-11-01	0.00	0.00	0.00	[{"num": 8, "price": 68.75, "unit_id": 0, "goods_id": 997, "goods_name": "茶专用/盐包", "total_price": 550}]	从saas.mzth.cn导入 原单号:CG0002418	0	0		0		2026-03-30 16:56:37.468581	2026-03-30 17:10:23.966646
148	CG202603305094	CG202603301861	114			2025-11-01	0.00	0.00	0.00	[{"num": 1, "price": 7.08, "unit_id": 0, "goods_id": 989, "goods_name": "蒙古黄油/瓶装成品", "total_price": 7.08}, {"num": 2, "price": 7.08, "unit_id": 0, "goods_id": 989, "goods_name": "蒙古黄油/瓶装成品", "total_price": 14.16}, {"num": 2, "price": 12.78, "unit_id": 0, "goods_id": 988, "goods_name": "原味传统奶豆腐/成品袋装", "total_price": 25.56}]	从saas.mzth.cn导入 原单号:CG0002419	0	0		0		2026-03-30 16:56:36.862807	2026-03-30 17:10:24.418092
133	CG202603308314	CG202603309369	97			2025-12-03	0.00	0.00	0.00	[{"num": 10, "price": 45, "unit_id": 0, "goods_id": 972, "goods_name": "原味/散称/奶豆腐块儿", "total_price": 450}, {"num": 10, "price": 45, "unit_id": 0, "goods_id": 971, "goods_name": "甜味/散称/奶豆腐块儿", "total_price": 450}, {"num": 38, "price": 4.2, "unit_id": 0, "goods_id": 965, "goods_name": "半成品/透明/冻炒米", "total_price": 159.6}, {"num": 50, "price": 10, "unit_id": 0, "goods_id": 970, "goods_name": "热奶豆腐碗", "total_price": 500}, {"num": 30, "price": 13, "unit_id": 0, "goods_id": 968, "goods_name": "大/奶皮", "total_price": 390}, {"num": 30, "price": 10, "unit_id": 0, "goods_id": 969, "goods_name": "小/奶皮", "total_price": 300}, {"num": 5, "price": 4, "unit_id": 0, "goods_id": 967, "goods_name": "查嘎/乳清", "total_price": 20}, {"num": 30, "price": 3, "unit_id": 0, "goods_id": 966, "goods_name": "查嘎粉/小包装袋", "total_price": 90}]	从saas.mzth.cn导入 原单号:CG0002851	0	0		0		2026-03-30 16:56:26.676494	2026-03-30 17:10:31.925347
132	CG202603301459	CG202603303407	97			2025-12-04	0.00	0.00	0.00	[{"num": 20, "price": 14.5, "unit_id": 0, "goods_id": 973, "goods_name": "精品/奶豆腐块儿/甜味/", "total_price": 290}, {"num": 20, "price": 14.5, "unit_id": 0, "goods_id": 986, "goods_name": "精品/奶豆腐块儿/原味", "total_price": 290}, {"num": 32, "price": 6, "unit_id": 0, "goods_id": 974, "goods_name": "纯净黄油/瓶装好的", "total_price": 192}]	从saas.mzth.cn导入 原单号:CG0002852	0	0		0		2026-03-30 16:56:26.011527	2026-03-30 17:10:32.395137
131	CG202603306307	CG202603303366	96			2025-12-04	0.00	0.00	0.00	[{"num": 240, "price": 0.8, "unit_id": 0, "goods_id": 963, "goods_name": "小/方形/亚克力盒/", "total_price": 192}, {"num": 258, "price": 0.85, "unit_id": 0, "goods_id": 962, "goods_name": "中/方形/亚克力盒/", "total_price": 219.3}, {"num": 200, "price": 0.85, "unit_id": 0, "goods_id": 960, "goods_name": "三角/奶皮千层盒", "total_price": 170}, {"num": 300, "price": 1.75, "unit_id": 0, "goods_id": 961, "goods_name": "扁盒/亚克力/带内托", "total_price": 525}, {"num": 246, "price": 2.6, "unit_id": 0, "goods_id": 959, "goods_name": "大/牛薄脆盒/亚克力", "total_price": 639.6}, {"num": 183, "price": 1.2, "unit_id": 0, "goods_id": 958, "goods_name": "小/长方/亚克力/乳清奶条盒", "total_price": 219.6}, {"num": 180, "price": 1.3, "unit_id": 0, "goods_id": 957, "goods_name": "大/长方/亚克力/待用", "total_price": 234}]	从saas.mzth.cn导入 原单号:CG0002853	0	0		0		2026-03-30 16:56:25.402208	2026-03-30 17:10:32.868729
125	CG202603303418	CG202603305464	97			2025-12-05	0.00	0.00	0.00	[{"num": 19, "price": 25, "unit_id": 0, "goods_id": 926, "goods_name": "大奶豆腐砖/1.2斤", "total_price": 475}, {"num": 20, "price": 20, "unit_id": 0, "goods_id": 927, "goods_name": "小奶豆腐砖/1斤", "total_price": 400}, {"num": 20, "price": 20, "unit_id": 0, "goods_id": 925, "goods_name": "小/无印花/奶豆腐砖/1斤", "total_price": 400}, {"num": 29, "price": 14, "unit_id": 0, "goods_id": 946, "goods_name": "半成品/透明/鲜奶皮", "total_price": 406}, {"num": 6, "price": 14, "unit_id": 0, "goods_id": 945, "goods_name": "半成品/透明/奶皮卷", "total_price": 84}, {"num": 40, "price": 13, "unit_id": 0, "goods_id": 939, "goods_name": "半成品/透明/原味/鲜奶酪", "total_price": 520}, {"num": 40, "price": 13, "unit_id": 0, "goods_id": 940, "goods_name": "半成品/透明/甜味/鲜奶酪", "total_price": 520}]	从saas.mzth.cn导入 原单号:CG0002866	0	0		0		2026-03-30 16:56:21.654815	2026-03-30 17:10:35.735691
120	CG202603308826	CG202603307119	98			2025-12-10	0.00	0.00	0.00	[{"num": 30, "price": 5.46667, "unit_id": 0, "goods_id": 901, "goods_name": "手工白花炒米/散装", "total_price": 164}, {"num": 5, "price": 22, "unit_id": 0, "goods_id": 902, "goods_name": "乌日莫糖/散装", "total_price": 110}, {"num": 4, "price": 8, "unit_id": 0, "goods_id": 915, "goods_name": "黄油渣/盒", "total_price": 32}, {"num": 10, "price": 22, "unit_id": 0, "goods_id": 981, "goods_name": "烤奶皮", "total_price": 220}]	从saas.mzth.cn导入 原单号:CG0002950	0	0		0		2026-03-30 16:56:18.53298	2026-03-30 17:10:39.473191
109	CG202603309824	CG202603305104	115			2025-12-14	0.00	0.00	0.00	[{"num": 10, "price": 5, "unit_id": 0, "goods_id": 891, "goods_name": "芝士奶豆腐月饼", "total_price": 50}, {"num": 10, "price": 5, "unit_id": 0, "goods_id": 893, "goods_name": "奶豆腐月饼", "total_price": 50}, {"num": 10, "price": 4, "unit_id": 0, "goods_id": 892, "goods_name": "那牧尔酸奶", "total_price": 40}, {"num": 10, "price": 5, "unit_id": 0, "goods_id": 895, "goods_name": "黄油渣月饼", "total_price": 50}, {"num": 10, "price": 5, "unit_id": 0, "goods_id": 896, "goods_name": "奶皮月饼", "total_price": 50}, {"num": 10, "price": 10, "unit_id": 0, "goods_id": 897, "goods_name": "早餐包/那牧尔", "total_price": 100}, {"num": 10, "price": 5, "unit_id": 0, "goods_id": 894, "goods_name": "酸奶月饼", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0003017	0	0		0		2026-03-30 16:56:10.642622	2026-03-30 17:10:46.434539
99	CG202603307564	CG202603307389	90			2025-12-25	0.00	0.00	0.00	[{"num": 4, "price": 10, "unit_id": 0, "goods_id": 880, "goods_name": "阿润月饼/五仁馅", "total_price": 40}, {"num": 4, "price": 5.5, "unit_id": 0, "goods_id": 879, "goods_name": "干肉奶茶", "total_price": 22}, {"num": 4, "price": 10, "unit_id": 0, "goods_id": 881, "goods_name": "阿润月饼/奶皮子馅", "total_price": 40}, {"num": 4, "price": 10, "unit_id": 0, "goods_id": 882, "goods_name": "阿润月饼/黄油渣馅", "total_price": 40}, {"num": 4, "price": 10, "unit_id": 0, "goods_id": 883, "goods_name": "阿润月饼/奶豆腐馅", "total_price": 40}]	从saas.mzth.cn导入 原单号:CG0003285	0	0		0		2026-03-30 16:56:04.096458	2026-03-30 17:17:00.084128
97	CG202603307474	CG202603309853	121			2025-12-25	0.00	0.00	0.00	[{"num": 500, "price": 0.0956, "unit_id": 0, "goods_id": 1024, "goods_name": "标签/不干胶/奶条/甜味", "total_price": 47.8}]	从saas.mzth.cn导入 原单号:CG0003288	0	0		0		2026-03-30 16:56:02.719119	2026-03-30 17:17:04.036863
95	CG202603303408	CG202603308003	121			2025-12-25	0.00	0.00	0.00	[{"num": 500, "price": 0.0432, "unit_id": 0, "goods_id": 983, "goods_name": "甜味/标签/不干胶/传统奶豆腐", "total_price": 21.6}, {"num": 500, "price": 0.0432, "unit_id": 0, "goods_id": 1021, "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 21.6}]	从saas.mzth.cn导入 原单号:CG0003290	0	0		0		2026-03-30 16:56:01.450826	2026-03-30 17:17:06.975817
67	CG202603306862	CG202603309252	82			2026-01-20	0.00	0.00	0.00	[{"num": 5, "price": 98, "unit_id": 0, "goods_id": 852, "goods_name": "牛肉干/散/孜然", "total_price": 490}, {"num": 5, "price": 98, "unit_id": 0, "goods_id": 853, "goods_name": "牛肉干/散/香辣", "total_price": 490}, {"num": 5, "price": 98, "unit_id": 0, "goods_id": 854, "goods_name": "牛肉干/散/原味", "total_price": 490}]	从saas.mzth.cn导入 原单号:CG0003935	0	0		0		2026-03-30 16:55:41.605859	2026-03-30 17:17:59.471444
62	CG202603304249	CG202603303450	98			2026-01-27	0.00	0.00	0.00	[{"num": 10, "price": 14, "unit_id": 0, "goods_id": 916, "goods_name": "脆奶条/散装/科尔沁", "total_price": 140}]	从saas.mzth.cn导入 原单号:CG0004088	0	0		0		2026-03-30 16:55:38.450517	2026-03-30 17:18:10.642297
222	CG202603306442	CG202603309984	85	糖炮	牧区纯坊官方品牌	2026-01-20	140.00	0.00	0.00	[{"num": 10.0, "spec": "3根", "price": 14.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "盒", "goods_name": "晴王糖葫芦", "total_price": 140.0}]	从saas.mzth.cn导入 原单号:CG0003936	0	0		0		2026-03-30 17:36:57.053462	2026-03-31 02:33:51.767354
60	CG202603307003	CG202603303645	80			2026-01-27	0.00	0.00	0.00	[{"num": 3, "price": 32, "unit_id": 0, "goods_id": 838, "goods_name": "奶粉蒙古国", "total_price": 96}, {"num": 4, "price": 12, "unit_id": 0, "goods_id": 839, "goods_name": "奶皮子粉", "total_price": 48}, {"num": 2, "price": 15, "unit_id": 0, "goods_id": 840, "goods_name": "奶茶粉战粮", "total_price": 30}, {"num": 2, "price": 18, "unit_id": 0, "goods_id": 841, "goods_name": "奶茶粉贡格尔", "total_price": 36}, {"num": 2, "price": 22, "unit_id": 0, "goods_id": 842, "goods_name": "努德勒沁调和茶", "total_price": 44}, {"num": 2, "price": 22, "unit_id": 0, "goods_id": 843, "goods_name": "阿依古丽奶茶专用红茶", "total_price": 44}, {"num": 2, "price": 22, "unit_id": 0, "goods_id": 844, "goods_name": "希日嘎拉奶茶专用茶", "total_price": 44}, {"num": 5, "price": 28, "unit_id": 0, "goods_id": 837, "goods_name": "甜味奶豆腐块儿/大", "total_price": 140}, {"num": 2, "price": 22, "unit_id": 0, "goods_id": 844, "goods_name": "希日嘎拉奶茶专用茶", "total_price": 44}]	从saas.mzth.cn导入 原单号:CG0004117	0	0		0		2026-03-30 16:55:37.199818	2026-03-30 17:18:13.528686
48	CG202603307140	CG202603307065	76			2026-02-10	0.00	0.00	0.00	[{"num": 3, "price": 15, "unit_id": 0, "goods_id": 825, "goods_name": "故乡宝酸马奶", "total_price": 45}, {"num": 5, "price": 9, "unit_id": 0, "goods_id": 826, "goods_name": "乌日汗酸奶", "total_price": 45}]	从saas.mzth.cn导入 原单号:CG0004387	0	0		0		2026-03-30 16:55:29.711864	2026-03-30 17:20:51.832713
46	CG202603308703	CG202603308492	98			2026-02-14	0.00	0.00	0.00	[{"num": 2, "price": 95, "unit_id": 0, "goods_id": 907, "goods_name": "风干牛肉500g大片", "total_price": 190}, {"num": 10, "price": 14, "unit_id": 0, "goods_id": 916, "goods_name": "脆奶条/散装/科尔沁", "total_price": 140}, {"num": 5, "price": 19, "unit_id": 0, "goods_id": 903, "goods_name": "盛宇燃奶豆腐/甜味", "total_price": 95}, {"num": 5, "price": 19, "unit_id": 0, "goods_id": 904, "goods_name": "盛宇燃奶豆腐/原味", "total_price": 95}, {"num": 5, "price": 15, "unit_id": 0, "goods_id": 823, "goods_name": "黄油/中瓶", "total_price": 75}, {"num": 5, "price": 21, "unit_id": 0, "goods_id": 822, "goods_name": "黄油/大瓶/科尔沁", "total_price": 105}, {"num": 5, "price": 19, "unit_id": 0, "goods_id": 829, "goods_name": "奶豆腐/原味/中/科尔沁", "total_price": 95}, {"num": 2, "price": 85, "unit_id": 0, "goods_id": 908, "goods_name": "哈斯乌拉牛肉干500g原味", "total_price": 170}]	从saas.mzth.cn导入 原单号:CG0004417	0	0		0		2026-03-30 16:55:28.477062	2026-03-30 17:20:52.900369
435	CG202603313199	CG202603312552	92	奥都奶食品	牧区纯坊官方品牌	2025-12-07	240.00	0.00	0.00	[{"num": 5, "spec": "300克", "price": 8, "unit_id": 0, "goods_id": 924, "goods_sn": "SP0000111", "unit_name": "袋", "goods_name": "冻炒米/袋装", "total_price": 40}, {"num": 2, "spec": "斤", "price": 9, "unit_id": 0, "goods_id": 917, "goods_sn": "SP0000118", "unit_name": "斤", "goods_name": "机器乌日末液体", "total_price": 18}, {"num": 10, "spec": "斤", "price": 8, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 80}, {"num": 2, "spec": "半斤装", "price": 11, "unit_id": 0, "goods_id": 918, "goods_sn": "SP0000117", "unit_name": "瓶", "goods_name": "黄油/半斤", "total_price": 22}, {"num": 4, "spec": "400克", "price": 20, "unit_id": 0, "goods_id": 919, "goods_sn": "SP0000116", "unit_name": "瓶", "goods_name": "黄油/斤", "total_price": 80}]	从saas.mzth.cn导入 原单号:CG0002900	0	0		0		2026-03-31 02:37:17.643263	\N
209	CG202603304272	CG202603306096	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-04	50.00	0.00	0.00	[{"num": 10.0, "spec": "斤", "price": 5.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 50.0}]	从saas.mzth.cn导入 原单号:CG0004288	0	0		0		2026-03-30 17:36:35.089837	2026-03-31 02:33:59.006039
197	CG202603307370	CG202603309208	84	兴安盟杭盖奶制品厂	牧区纯坊官方品牌	2026-02-27	380.00	0.00	0.00	[{"num": 20.0, "spec": "1", "price": 19.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "厚奶皮", "total_price": 380.0}]	从saas.mzth.cn导入 原单号:CG0004457	0	0		0		2026-03-30 17:36:16.544084	2026-03-31 02:34:05.675639
196	CG202603307651	CG202603309996	98	科尔沁奶食品	1号店员专用	2026-03-01	110.00	0.00	0.00	[{"num": 5, "spec": "1斤散称", "price": 22, "unit_id": 0, "goods_id": 902, "goods_sn": "SP0000133", "unit_name": "斤", "goods_name": "乌日莫糖/散装", "total_price": 110}]	从saas.mzth.cn导入 原单号:CG0004469	0	0		0		2026-03-30 17:36:15.585303	\N
195	CG202603308599	CG202603302815	98	科尔沁奶食品	1号店员专用	2026-03-01	75.00	0.00	0.00	[{"num": 5, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 75}]	从saas.mzth.cn导入 原单号:CG0004470	0	0		0		2026-03-30 17:36:14.49444	\N
194	CG202603307971	CG202603307964	98	科尔沁奶食品	1号店员专用	2026-03-01	50.00	0.00	0.00	[{"num": 5, "spec": "1斤散称", "price": 10, "unit_id": 0, "goods_id": 922, "goods_sn": "SP0000113", "unit_name": "斤", "goods_name": "酸奶炒米糖/散装", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0004471	0	0		0		2026-03-30 17:36:13.3704	\N
193	CG202603302271	CG202603304465	98	科尔沁奶食品	1号店员专用	2026-03-01	50.00	0.00	0.00	[{"num": 10, "spec": "斤", "price": 5, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0004472	0	0		0		2026-03-30 17:36:12.360403	\N
192	CG202603307749	CG202603301337	98	科尔沁奶食品	1号店员专用	2026-03-01	220.00	0.00	0.00	[{"num": 10, "spec": "斤/两盒", "price": 22, "unit_id": 0, "goods_id": 981, "goods_sn": "SP0000053", "unit_name": "盒", "goods_name": "烤奶皮", "total_price": 220}]	从saas.mzth.cn导入 原单号:CG0004473	0	0		0		2026-03-30 17:36:11.136003	\N
442	CG202603319829	CG202603313985	96	浙江金矿包装	牧区纯坊官方品牌	2025-12-04	2199.50	0.00	0.00	[{"num": 240, "spec": "7.4X7.4X7.8 奶豆腐/冻炒米通用", "price": 0.8, "unit_id": 0, "goods_id": 963, "goods_sn": "SP0000071", "unit_name": "盒", "goods_name": "小/方形/亚克力盒/", "total_price": 192}, {"num": 258, "spec": "85X85X63 鲜奶皮", "price": 0.85, "unit_id": 0, "goods_id": 962, "goods_sn": "SP0000072", "unit_name": "盒", "goods_name": "中/方形/亚克力盒/", "total_price": 219.3}, {"num": 200, "spec": "31g", "price": 0.85, "unit_id": 0, "goods_id": 960, "goods_sn": "SP0000075", "unit_name": "盒", "goods_name": "三角/奶皮千层盒", "total_price": 170}, {"num": 300, "spec": "182X120X28/烤奶豆腐片/奶皮卷", "price": 1.75, "unit_id": 0, "goods_id": 961, "goods_sn": "SP0000074", "unit_name": "盒", "goods_name": "扁盒/亚克力/带内托", "total_price": 525}, {"num": 246, "spec": "235X170X35", "price": 2.6, "unit_id": 0, "goods_id": 959, "goods_sn": "SP0000076", "unit_name": "盒", "goods_name": "大/牛薄脆盒/亚克力", "total_price": 639.6}, {"num": 183, "spec": "乳清奶条盒", "price": 1.2, "unit_id": 0, "goods_id": 958, "goods_sn": "SP0000077", "unit_name": "盒", "goods_name": "小/长方/亚克力/乳清奶条盒", "total_price": 219.6}, {"num": 180, "spec": "待包换/冻炒米 145X85X55", "price": 1.3, "unit_id": 0, "goods_id": 957, "goods_sn": "SP0000078", "unit_name": "盒", "goods_name": "大/长方/亚克力/待用", "total_price": 234}]	从saas.mzth.cn导入 原单号:CG0002853	0	0		0		2026-03-31 02:37:39.743657	\N
206	CG202603303422	CG202603303612	98	科尔沁奶食品	1号店员专用	2026-02-09	158.00	0.00	0.00	[{"num": 30.0, "spec": "1斤", "price": 5.26667, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "麻袋", "goods_name": "手工白花炒米/散装", "total_price": 158.0}]	从saas.mzth.cn导入 原单号:CG0004383	0	0		0		2026-03-30 17:36:31.294371	2026-03-31 02:34:00.606344
205	CG202603309149	CG202603302790	98	科尔沁奶食品	1号店员专用	2026-02-10	50.00	0.00	0.00	[{"num": 10.0, "spec": "斤", "price": 5.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 50.0}]	从saas.mzth.cn导入 原单号:CG0004384	0	0		0		2026-03-30 17:36:30.427438	2026-03-31 02:34:01.106244
203	CG202603309361	CG202603302105	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-12	145.00	0.00	0.00	[{"num": 30.0, "spec": "10斤装/麻袋", "price": 4.83333, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "炒米/散装/硬口", "total_price": 145.0}]	从saas.mzth.cn导入 原单号:CG0004414	0	0		0		2026-03-30 17:36:28.256548	2026-03-31 02:34:02.204488
201	CG202603308933	CG202603304739	75	格日勒	牧区纯坊官方品牌	2026-02-23	100.00	0.00	0.00	[{"num": 12.0, "spec": "250克", "price": 8.33333, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "蒙古果子/格日勒", "total_price": 100.0}]	从saas.mzth.cn导入 原单号:CG0004426	0	0		0		2026-03-30 17:36:23.412689	2026-03-31 02:34:03.609665
200	CG202603306934	CG202603309835	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-23	850.00	0.00	0.00	[{"num": 10.0, "spec": "1斤", "price": 85.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "哈斯乌拉牛肉干500g原味", "total_price": 850.0}]	从saas.mzth.cn导入 原单号:CG0004427	0	0		0		2026-03-30 17:36:22.425917	2026-03-31 02:34:04.137085
199	CG202603306249	CG202603306071	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-23	450.00	0.00	0.00	[{"num": 5.0, "spec": "1.2", "price": 33.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "科尔沁/大奶豆腐", "total_price": 165.0}, {"num": 5.0, "spec": "1", "price": 19.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "奶豆腐/原味/中/科尔沁", "total_price": 95.0}, {"num": 5.0, "spec": "500g", "price": 19.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/甜味", "total_price": 95.0}, {"num": 5.0, "spec": "500g", "price": 19.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/原味", "total_price": 95.0}]	从saas.mzth.cn导入 原单号:CG0004428	0	0		0		2026-03-30 17:36:21.373385	2026-03-31 02:34:04.700052
249	CG202603306447	CG202603309267	117	巴音珠萨朗	牧区纯坊官方品牌	2025-12-28	310.20	0.00	0.00	[{"num": 18.8, "spec": "250克/一袋", "price": 16.5, "unit_id": 0, "goods_id": 1014, "goods_sn": "SP0000020", "unit_name": "斤", "goods_name": "散装/甜味奶条", "total_price": 310.2}]	从saas.mzth.cn导入 原单号:CG0003398	0	0		0		2026-03-30 17:37:29.399047	\N
221	CG202603309586	CG202603301192	93	杂/采购商	牧区纯坊官方品牌	2026-01-20	49.36	0.00	0.00	[{"num": 100.0, "spec": "1", "price": 0.4936, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "红糖袋/delicious", "total_price": 49.36}]	从saas.mzth.cn导入 原单号:CG0003944	0	0		0		2026-03-30 17:36:56.172851	2026-03-31 02:33:52.290858
220	CG202603305713	CG202603307191	106	拼多多/热缩膜	牧区纯坊官方品牌	2026-01-20	140.00	0.00	0.00	[{"num": 2000.0, "spec": "1", "price": 0.07, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "冻炒米专用/塑膜袋", "total_price": 140.0}]	从saas.mzth.cn导入 原单号:CG0003945	0	0		0		2026-03-30 17:36:55.314084	2026-03-31 02:33:52.774498
218	CG202603302983	CG202603306596	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-27	140.00	0.00	0.00	[{"num": 10.0, "spec": "半斤", "price": 14.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "脆奶条/散装/科尔沁", "total_price": 140.0}]	从saas.mzth.cn导入 原单号:CG0004088	0	0		0		2026-03-30 17:36:52.141113	2026-03-31 02:33:53.766277
217	CG202603308993	CG202603303803	81	额吉伊德	牧区纯坊官方品牌	2026-01-27	161.00	0.00	0.00	[{"num": 20.0, "spec": "250克", "price": 4.5, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "瓶", "goods_name": "乳清饮料", "total_price": 90.0}, {"num": 6.0, "spec": "250克", "price": 6.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "瓶", "goods_name": "酸奶/额吉伊德", "total_price": 36.0}, {"num": 5.0, "spec": "500克", "price": 7.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "乌日莫/袋装", "total_price": 35.0}]	从saas.mzth.cn导入 原单号:CG0004116	0	0		0		2026-03-30 17:36:51.269104	2026-03-31 02:33:54.318912
216	CG202603308189	CG202603309097	80	奥特尔奶食品店	牧区纯坊官方品牌	2026-01-27	526.00	0.00	0.00	[{"num": 3.0, "spec": "2斤装", "price": 32.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "奶粉蒙古国", "total_price": 96.0}, {"num": 4.0, "spec": "360克", "price": 12.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "奶皮子粉", "total_price": 48.0}, {"num": 2.0, "spec": "300克", "price": 15.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "盒", "goods_name": "奶茶粉战粮", "total_price": 30.0}, {"num": 2.0, "spec": "400克", "price": 18.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "奶茶粉贡格尔", "total_price": 36.0}, {"num": 2.0, "spec": "400克", "price": 22.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "努德勒沁调和茶", "total_price": 44.0}, {"num": 2.0, "spec": "400克", "price": 22.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "阿依古丽奶茶专用红茶", "total_price": 44.0}, {"num": 2.0, "spec": "400克", "price": 22.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "盒", "goods_name": "希日嘎拉奶茶专用茶", "total_price": 44.0}, {"num": 5.0, "spec": "1一斤", "price": 28.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "甜味奶豆腐块儿/大", "total_price": 140.0}, {"num": 2.0, "spec": "400克", "price": 22.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "盒", "goods_name": "希日嘎拉奶茶专用茶", "total_price": 44.0}]	从saas.mzth.cn导入 原单号:CG0004117	0	0		0		2026-03-30 17:36:49.178959	2026-03-31 02:33:54.93204
215	CG202603301250	CG202603302563	79	沈阳包装	牧区纯坊官方品牌	2026-01-27	2785.97	0.00	0.00	[{"num": 540.0, "spec": "1", "price": 5.1592, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "个", "goods_name": "礼盒/2026", "total_price": 2785.97}]	从saas.mzth.cn导入 原单号:CG0004118	0	0		0		2026-03-30 17:36:44.452225	2026-03-31 02:33:55.432998
214	CG202603301515	CG202603305289	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-01	1163.00	0.00	0.00	[{"num": 40.0, "spec": "斤/两盒", "price": 22.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 880.0}, {"num": 3.0, "spec": "500g", "price": 19.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/甜味", "total_price": 57.0}, {"num": 4.0, "spec": "500g", "price": 19.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/原味", "total_price": 76.0}, {"num": 10.0, "spec": "1斤散称", "price": 15.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 150.0}]	从saas.mzth.cn导入 原单号:CG0004239	0	0		0		2026-03-30 17:36:43.594856	2026-03-31 02:33:56.02205
213	CG202603308793	CG202603309997	92	奥都奶食品	牧区纯坊官方品牌	2025-12-31	315.00	0.00	0.00	[{"num": 5.0, "spec": "半斤装", "price": 11.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "瓶", "goods_name": "黄油/半斤", "total_price": 55.0}, {"num": 5.0, "spec": "400克", "price": 20.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "瓶", "goods_name": "黄油/斤", "total_price": 100.0}, {"num": 10.0, "spec": "1", "price": 16.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "冻炒米/散装", "total_price": 160.0}]	从saas.mzth.cn导入 原单号:CG0004240	0	0		0		2026-03-30 17:36:41.214218	2026-03-31 02:33:56.925181
212	CG202603305508	CG202603302857	86	雷记炒货	牧区纯坊官方品牌	2026-02-01	100.00	0.00	0.00	[{"num": 10.0, "spec": "散称", "price": 10.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "散", "goods_name": "普通瓜子", "total_price": 100.0}]	从saas.mzth.cn导入 原单号:CG0004241	0	0		0		2026-03-30 17:36:39.058819	2026-03-31 02:33:57.43629
211	CG202603303806	CG202603308692	90	阿润查干	牧区纯坊官方品牌	2026-02-01	200.00	0.00	0.00	[{"num": 10.0, "spec": "4颗/350克", "price": 10.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "阿润月饼/五仁馅", "total_price": 100.0}, {"num": 5.0, "spec": "4颗/350克", "price": 10.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "阿润月饼/黄油渣馅", "total_price": 50.0}, {"num": 5.0, "spec": "1斤装", "price": 10.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "果条/阿润", "total_price": 50.0}]	从saas.mzth.cn导入 原单号:CG0004242	0	0		0		2026-03-30 17:36:38.134984	2026-03-31 02:33:57.959304
235	CG202603305802	CG202603306405	96	浙江金矿包装	牧区纯坊官方品牌	2026-01-11	611.76	0.00	0.00	[{"num": 720.0, "spec": "7.4X7.4X7.8 奶豆腐/冻炒米通用", "price": 0.84967, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "盒", "goods_name": "小/方形/亚克力盒/", "total_price": 611.76}]	从saas.mzth.cn导入 原单号:CG0003705	0	0		0		2026-03-30 17:37:11.945728	2026-03-31 02:33:43.839647
234	CG202603305544	CG202603307003	86	雷记炒货	牧区纯坊官方品牌	2026-01-11	200.00	0.00	0.00	[{"num": 5.0, "spec": "散称", "price": 10.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "散", "goods_name": "普通瓜子", "total_price": 50.0}, {"num": 10.0, "spec": "散称", "price": 15.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "散", "goods_name": "五香瓜子", "total_price": 150.0}]	从saas.mzth.cn导入 原单号:CG0003706	0	0		0		2026-03-30 17:37:11.108245	2026-03-31 02:33:44.65438
233	CG202603303811	CG202603309281	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-11	48.00	0.00	0.00	[{"num": 10.0, "spec": "500g", "price": 4.8, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "炒米粉/aag", "total_price": 48.0}]	从saas.mzth.cn导入 原单号:CG0003707	0	0		0		2026-03-30 17:37:09.85947	2026-03-31 02:33:45.181541
231	CG202603301825	CG202603309177	85	糖炮	牧区纯坊官方品牌	2026-01-16	240.00	0.00	0.00	[{"num": 40.0, "spec": "3棵", "price": 6.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "盒", "goods_name": "糖葫芦", "total_price": 240.0}]	从saas.mzth.cn导入 原单号:CG0003839	0	0		0		2026-03-30 17:37:07.488862	2026-03-31 02:33:46.208016
230	CG202603305362	CG202603309984	113	永巨茶业	牧区纯坊官方品牌	2026-01-16	3310.00	0.00	0.00	[{"num": 10.0, "spec": "1件2000包/300元/1件", "price": 331.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "件", "goods_name": "茶包", "total_price": 3310.0}]	从saas.mzth.cn导入 原单号:CG0003840	0	0		0		2026-03-30 17:37:06.640305	2026-03-31 02:33:46.682993
229	CG202603304784	CG202603308954	84	兴安盟杭盖奶制品厂	牧区纯坊官方品牌	2026-01-17	190.00	0.00	0.00	[{"num": 10.0, "spec": "1", "price": 19.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "厚奶皮", "total_price": 190.0}]	从saas.mzth.cn导入 原单号:CG0003860	0	0		0		2026-03-30 17:37:05.674391	2026-03-31 02:33:47.978164
228	CG202603302405	CG202603306686	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-17	378.00	0.00	0.00	[{"num": 10.0, "spec": "斤/两盒", "price": 22.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 220.0}, {"num": 30.0, "spec": "1斤", "price": 5.26667, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "麻袋", "goods_name": "手工白花炒米/散装", "total_price": 158.0}]	从saas.mzth.cn导入 原单号:CG0003873	0	0		0		2026-03-30 17:37:04.432999	2026-03-31 02:33:48.56991
227	CG202603303658	CG202603302263	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-19	147.00	0.00	0.00	[{"num": 3.0, "spec": "1.2", "price": 33.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "科尔沁/大奶豆腐", "total_price": 99.0}, {"num": 1.0, "spec": "10斤装/麻袋", "price": 48.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "麻袋", "goods_name": "炒米/散装/硬口", "total_price": 48.0}]	从saas.mzth.cn导入 原单号:CG0003897	0	0		0		2026-03-30 17:37:03.160871	2026-03-31 02:33:49.056221
226	CG202603305993	CG202603304586	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2026-01-19	6364.00	0.00	0.00	[{"num": 130.0, "spec": "140克", "price": 48.95385, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "半成品/黄金纬度牛肉干/那牧尔", "total_price": 6364.0}]	从saas.mzth.cn导入 原单号:CG0003899	0	0		0		2026-03-30 17:37:01.917917	2026-03-31 02:33:49.66009
225	CG202603306081	CG202603309422	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-20	80.00	0.00	0.00	[{"num": 10.0, "spec": "斤", "price": 8.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 80.0}]	从saas.mzth.cn导入 原单号:CG0003930	0	0		0		2026-03-30 17:37:01.034871	2026-03-31 02:33:50.212702
224	CG202603309653	CG202603308680	83	扎旗吉十奶制品	牧区纯坊官方品牌	2026-01-20	90.00	0.00	0.00	[{"num": 5.0, "spec": "散", "price": 18.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "散", "goods_name": "奶锅巴/扎旗吉十奶制品", "total_price": 90.0}]	从saas.mzth.cn导入 原单号:CG0003933	0	0		0		2026-03-30 17:36:59.73236	2026-03-31 02:33:50.692818
250	CG202603306801	CG202603304562	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-28	75.00	0.00	0.00	[{"num": 6, "spec": "1一斤装", "price": 12.5, "unit_id": 0, "goods_id": 878, "goods_sn": "SP0000157", "unit_name": "盒", "goods_name": "羊奶粉/1斤", "total_price": 75}]	从saas.mzth.cn导入 原单号:CG0003393	0	0		0		2026-03-30 17:37:30.2604	\N
245	CG202603301201	CG202603301157	97	纯净奶食品	牧区纯坊官方品牌	2026-01-01	1396.00	0.00	0.00	[{"num": 10.0, "spec": "斤", "price": 10.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 100.0}, {"num": 36.0, "spec": "200克", "price": 10.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "盒", "goods_name": "热奶豆腐碗", "total_price": 360.0}, {"num": 20.0, "spec": "200克", "price": 13.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "盒", "goods_name": "半成品/透明/原味/鲜奶酪", "total_price": 260.0}, {"num": 52.0, "spec": "200克", "price": 13.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "盒", "goods_name": "半成品/透明/甜味/鲜奶酪", "total_price": 676.0}]	从saas.mzth.cn导入 原单号:CG0003473	0	0		0		2026-03-30 17:37:24.26984	2026-03-31 02:33:38.144569
244	CG202603308753	CG202603301448	97	纯净奶食品	牧区纯坊官方品牌	2026-01-03	60.00	0.00	0.00	[{"num": 10.0, "spec": "400ke", "price": 6.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "瓶", "goods_name": "酸奶/纯净", "total_price": 60.0}]	从saas.mzth.cn导入 原单号:CG0003504	0	0		0		2026-03-30 17:37:22.184371	2026-03-31 02:33:38.695336
243	CG202603309180	CG202603309756	88	茁硕乐/牛肉干	牧区纯坊官方品牌	2026-01-03	980.00	0.00	0.00	[{"num": 20.0, "spec": "250克", "price": 49.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "牛肉干/和希格图", "total_price": 980.0}]	从saas.mzth.cn导入 原单号:CG0003505	0	0		0		2026-03-30 17:37:21.337915	2026-03-31 02:33:39.373789
242	CG202603305060	CG202603304434	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-06	220.00	0.00	0.00	[{"num": 10.0, "spec": "斤/两盒", "price": 22.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 220.0}]	从saas.mzth.cn导入 原单号:CG0003544	0	0		0		2026-03-30 17:37:20.351512	2026-03-31 02:33:39.898948
241	CG202603306633	CG202603301533	117	巴音珠萨朗	牧区纯坊官方品牌	2026-01-06	854.00	0.00	0.00	[{"num": 53.4, "spec": "250克/一袋", "price": 15.99251, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "散装/甜味奶条", "total_price": 854.0}]	从saas.mzth.cn导入 原单号:CG0003546	0	0		0		2026-03-30 17:37:19.514203	2026-03-31 02:33:40.390103
240	CG202603301927	CG202603304268	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-07	713.00	0.00	0.00	[{"num": 1.0, "spec": "10斤装/麻袋", "price": 48.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "麻袋", "goods_name": "炒米/散装/硬口", "total_price": 48.0}, {"num": 10.0, "spec": "斤/两盒", "price": 22.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 220.0}, {"num": 3.0, "spec": "1斤", "price": 85.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "哈斯乌拉牛肉干500g原味", "total_price": 255.0}, {"num": 2.0, "spec": "1斤", "price": 95.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "风干牛肉500g大片", "total_price": 190.0}]	从saas.mzth.cn导入 原单号:CG0003599	0	0		0		2026-03-30 17:37:18.682801	2026-03-31 02:33:40.95906
239	CG202603306670	CG202603309558	108	山东锦食食品	牧区纯坊官方品牌	2026-01-09	687.00	0.00	0.00	[{"num": 10.0, "spec": "2g", "price": 68.7, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "件", "goods_name": "茶专用/盐包", "total_price": 687.0}]	从saas.mzth.cn导入 原单号:CG0003666	0	0		0		2026-03-30 17:37:16.591487	2026-03-31 02:33:41.455196
238	CG202603303569	CG202603304315	105	翁牛特旗奶果子	牧区纯坊官方品牌	2026-01-09	3653.00	0.00	0.00	[{"num": 119.0, "spec": "平均一块儿", "price": 30.69748, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "奶果子/散装", "total_price": 3653.0}]	从saas.mzth.cn导入 原单号:CG0003667	0	0		0		2026-03-30 17:37:15.48478	2026-03-31 02:33:41.990552
237	CG202603306751	CG202603306197	97	纯净奶食品	牧区纯坊官方品牌	2026-01-01	424.40	0.00	0.00	[{"num": 21.0, "spec": "150克", "price": 12.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "盒", "goods_name": "半成品/透明/奶皮千层", "total_price": 252.0}, {"num": 10.0, "spec": "1", "price": 15.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "冻炒米/散装", "total_price": 150.0}, {"num": 100.0, "spec": "7克/包", "price": 0.224, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "个", "goods_name": "冻炒米/小包散/精品", "total_price": 22.4}]	从saas.mzth.cn导入 原单号:CG0003668	0	0		0		2026-03-30 17:37:14.613085	2026-03-31 02:33:42.803991
248	CG202603308047	CG202603303265	111	优如包装	牧区纯坊官方品牌	2025-12-07	4400.01	0.00	0.00	[{"num": 3000, "spec": "140克", "price": 1.46667, "unit_id": 0, "goods_id": 873, "goods_sn": "SP0000162", "unit_name": "袋", "goods_name": "专袋/牛肉干包装", "total_price": 4400.01}]	从saas.mzth.cn导入 原单号:CG0003407	0	0		0		2026-03-30 17:37:28.542392	\N
247	CG202603301851	CG202603307866	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-28	75.00	0.00	0.00	[{"num": 5, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 75}]	从saas.mzth.cn导入 原单号:CG0003418	0	0		0		2026-03-30 17:37:27.695592	\N
258	CG202603309920	CG202603308504	97	纯净奶食品	牧区纯坊官方品牌	2025-12-21	325.00	0.00	0.00	[{"num": 25, "spec": "180克", "price": 13, "unit_id": 0, "goods_id": 945, "goods_sn": "SP0000090", "unit_name": "盒", "goods_name": "半成品/透明/奶皮卷", "total_price": 325}]	从saas.mzth.cn导入 原单号:CG0003139	0	0		0		2026-03-30 17:37:42.459079	\N
257	CG202603309170	CG202603304138	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-24	150.00	0.00	0.00	[{"num": 10, "spec": "1盒", "price": 15, "unit_id": 0, "goods_id": 889, "goods_sn": "SP0000146", "unit_name": "盒", "goods_name": "奶皮卷/科尔沁", "total_price": 150}]	从saas.mzth.cn导入 原单号:CG0003217	0	0		0		2026-03-30 17:37:41.605729	\N
256	CG202603309125	CG202603304408	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-25	140.00	0.00	0.00	[{"num": 9, "spec": "1", "price": 10, "unit_id": 0, "goods_id": 884, "goods_sn": "SP0000151", "unit_name": "个", "goods_name": "实惠/奶豆腐", "total_price": 90}, {"num": 10, "spec": "斤", "price": 5, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0003253	0	0		0		2026-03-30 17:37:40.657753	\N
253	CG202603308630	CG202603309910	121	盛大印刷	牧区纯坊官方品牌	2025-12-25	47.80	0.00	0.00	[{"num": 500, "spec": "1", "price": 0.0956, "unit_id": 0, "goods_id": 1024, "goods_sn": "SP0000010", "unit_name": "张", "goods_name": "标签/不干胶/奶条/甜味", "total_price": 47.8}]	从saas.mzth.cn导入 原单号:CG0003288	0	0		0		2026-03-30 17:37:33.427975	\N
252	CG202603304874	CG202603305547	121	盛大印刷	牧区纯坊官方品牌	2025-12-25	33.50	0.00	0.00	[{"num": 500, "spec": "1张", "price": 0.067, "unit_id": 0, "goods_id": 898, "goods_sn": "SP0000137", "unit_name": "张", "goods_name": "透专标签/奶皮千层", "total_price": 33.5}]	从saas.mzth.cn导入 原单号:CG0003289	0	0		0		2026-03-30 17:37:32.594024	\N
251	CG202603309029	CG202603307437	121	盛大印刷	牧区纯坊官方品牌	2025-12-25	43.20	0.00	0.00	[{"num": 500, "spec": "1", "price": 0.0432, "unit_id": 0, "goods_id": 983, "goods_sn": "SP0000051", "unit_name": "张", "goods_name": "甜味/标签/不干胶/传统奶豆腐", "total_price": 21.6}, {"num": 500, "spec": "1", "price": 0.0432, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 21.6}]	从saas.mzth.cn导入 原单号:CG0003290	0	0		0		2026-03-30 17:37:31.750366	\N
367	CG202603314313	CG202603319793	90	阿润查干	牧区纯坊官方品牌	2026-02-01	200.00	0.00	0.00	[{"num": 10, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 880, "goods_sn": "SP0000155", "unit_name": "袋", "goods_name": "阿润月饼/五仁馅", "total_price": 100}, {"num": 5, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 882, "goods_sn": "SP0000153", "unit_name": "袋", "goods_name": "阿润月饼/黄油渣馅", "total_price": 50}, {"num": 5, "spec": "1斤装", "price": 10, "unit_id": 0, "goods_id": 831, "goods_sn": "SP0000205", "unit_name": "袋", "goods_name": "果条/阿润", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0004242	0	0		0		2026-03-31 02:34:49.756395	\N
271	CG202603309418	CG202603308919	112	广州维记	牧区纯坊官方品牌	2025-12-10	3380.00	0.00	0.00	[{"num": 20, "spec": "400/箱/0.423/球", "price": 169, "unit_id": 0, "goods_id": 1010, "goods_sn": "SP0000024", "unit_name": "件", "goods_name": "奶油球", "total_price": 3380}]	从saas.mzth.cn导入 原单号:CG0002956	0	0		0		2026-03-30 17:38:01.661932	\N
268	CG202603302265	CG202603301848	93	杂/采购商	牧区纯坊官方品牌	2025-12-10	21.00	0.00	0.00	[{"num": 6, "spec": "400克", "price": 3.5, "unit_id": 0, "goods_id": 929, "goods_sn": "SP0000106", "unit_name": "袋", "goods_name": "白砂糖", "total_price": 21}]	从saas.mzth.cn导入 原单号:CG0002994	0	0		0		2026-03-30 17:37:58.651259	\N
262	CG202603304928	CG202603307506	93	杂/采购商	牧区纯坊官方品牌	2025-12-17	144.00	0.00	0.00	[{"num": 12, "spec": "1", "price": 12, "unit_id": 0, "goods_id": 890, "goods_sn": "SP0000145", "unit_name": "斤", "goods_name": "红枣", "total_price": 144}]	从saas.mzth.cn导入 原单号:CG0003074	0	0		0		2026-03-30 17:37:49.238003	\N
261	CG202603304184	CG202603306479	97	纯净奶食品	牧区纯坊官方品牌	2025-12-17	971.50	0.00	0.00	[{"num": 17, "spec": "150克", "price": 14.5, "unit_id": 0, "goods_id": 973, "goods_sn": "SP0000061", "unit_name": "袋", "goods_name": "精品/奶豆腐块儿/甜味/", "total_price": 246.5}, {"num": 50, "spec": "150克", "price": 14.5, "unit_id": 0, "goods_id": 986, "goods_sn": "SP0000048", "unit_name": "袋", "goods_name": "精品/奶豆腐块儿/原味", "total_price": 725}]	从saas.mzth.cn导入 原单号:CG0003075	0	0		0		2026-03-30 17:37:48.402761	\N
410	CG202603313911	CG202603319076	90	阿润查干	牧区纯坊官方品牌	2025-12-25	182.00	0.00	0.00	[{"num": 4, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 880, "goods_sn": "SP0000155", "unit_name": "袋", "goods_name": "阿润月饼/五仁馅", "total_price": 40}, {"num": 4, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 879, "goods_sn": "SP0000156", "unit_name": "盒", "goods_name": "干肉奶茶", "total_price": 22}, {"num": 4, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 881, "goods_sn": "SP0000154", "unit_name": "袋", "goods_name": "阿润月饼/奶皮子馅", "total_price": 40}, {"num": 4, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 882, "goods_sn": "SP0000153", "unit_name": "袋", "goods_name": "阿润月饼/黄油渣馅", "total_price": 40}, {"num": 4, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 883, "goods_sn": "SP0000152", "unit_name": "袋", "goods_name": "阿润月饼/奶豆腐馅", "total_price": 40}]	从saas.mzth.cn导入 原单号:CG0003285	0	0		0		2026-03-31 02:36:14.630683	\N
269	CG202603308349	CG202603306310	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2025-12-12	550.00	0.00	0.00	[{"num": 100, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_sn": "SP0000021", "unit_name": "盒", "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 550}]	从saas.mzth.cn导入 原单号:CG0002993	0	0		0		2026-03-30 17:37:59.515518	\N
266	CG202603308629	CG202603302980	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-14	235.00	0.00	0.00	[{"num": 5, "spec": "1斤散称", "price": 22, "unit_id": 0, "goods_id": 902, "goods_sn": "SP0000133", "unit_name": "斤", "goods_name": "乌日莫糖/散装", "total_price": 110}, {"num": 5, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 75}, {"num": 5, "spec": "1斤散称", "price": 10, "unit_id": 0, "goods_id": 922, "goods_sn": "SP0000113", "unit_name": "斤", "goods_name": "酸奶炒米糖/散装", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0003015	0	0		0		2026-03-30 17:37:56.267363	\N
264	CG202603303596	CG202603302117	117	巴音珠萨朗	牧区纯坊官方品牌	2025-12-16	184.00	0.00	0.00	[{"num": 23, "spec": "250克/一袋", "price": 8, "unit_id": 0, "goods_id": 1014, "goods_sn": "SP0000020", "unit_name": "斤", "goods_name": "散装/甜味奶条", "total_price": 184}]	从saas.mzth.cn导入 原单号:CG0003056	0	0		0		2026-03-30 17:37:50.917505	\N
263	CG202603308467	CG202603304884	116	恩赫奶制品厂	牧区纯坊官方品牌	2025-12-16	216.00	0.00	0.00	[{"num": 12, "spec": "250克/一袋", "price": 18, "unit_id": 0, "goods_id": 1015, "goods_sn": "SP0000019", "unit_name": "斤", "goods_name": "散装/原味奶条", "total_price": 216}]	从saas.mzth.cn导入 原单号:CG0003057	0	0		0		2026-03-30 17:37:50.072786	\N
278	CG202603305554	CG202603304339	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-09	25.00	0.00	0.00	[{"num": 1, "spec": "1斤散称", "price": 10, "unit_id": 0, "goods_id": 922, "goods_sn": "SP0000113", "unit_name": "麻袋", "goods_name": "酸奶炒米糖/散装", "total_price": 10}, {"num": 1, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "麻袋", "goods_name": "嚼口脆炒米糖/散装", "total_price": 15}]	从saas.mzth.cn导入 原单号:CG0002913	0	0		0		2026-03-30 17:38:20.127486	\N
277	CG202603301508	CG202603304922	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-09	751.00	0.00	0.00	[{"num": 2, "spec": "1斤", "price": 95, "unit_id": 0, "goods_id": 907, "goods_sn": "SP0000128", "unit_name": "袋", "goods_name": "风干牛肉500g大片", "total_price": 190}, {"num": 2, "spec": "1斤", "price": 83, "unit_id": 0, "goods_id": 908, "goods_sn": "SP0000127", "unit_name": "袋", "goods_name": "哈斯乌拉牛肉干500g原味", "total_price": 166}, {"num": 2, "spec": "450g", "price": 7, "unit_id": 0, "goods_id": 909, "goods_sn": "SP0000126", "unit_name": "袋", "goods_name": "蓝旗绿乳糖惠虹糖", "total_price": 14}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 910, "goods_sn": "SP0000125", "unit_name": "袋", "goods_name": "蓝旗绿乳糖奶香酥", "total_price": 8}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 911, "goods_sn": "SP0000124", "unit_name": "袋", "goods_name": "蓝旗绿乳糖果仁酥", "total_price": 8}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 912, "goods_sn": "SP0000123", "unit_name": "袋", "goods_name": "蓝旗绿乳糖水果", "total_price": 8}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 913, "goods_sn": "SP0000122", "unit_name": "袋", "goods_name": "蓝旗绿乳糖黄油球", "total_price": 8}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 914, "goods_sn": "SP0000121", "unit_name": "袋", "goods_name": "蓝旗绿乳糖炼乳", "total_price": 8}, {"num": 1, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 15}, {"num": 1, "spec": "1斤散称", "price": 10, "unit_id": 0, "goods_id": 922, "goods_sn": "SP0000113", "unit_name": "斤", "goods_name": "酸奶炒米糖/散装", "total_price": 10}, {"num": 4, "spec": "250克", "price": 8, "unit_id": 0, "goods_id": 915, "goods_sn": "SP0000120", "unit_name": "盒", "goods_name": "黄油渣/盒", "total_price": 32}, {"num": 10, "spec": "半斤", "price": 14, "unit_id": 0, "goods_id": 916, "goods_sn": "SP0000119", "unit_name": "斤", "goods_name": "脆奶条/散装/科尔沁", "total_price": 140}, {"num": 2, "spec": "500g", "price": 17, "unit_id": 0, "goods_id": 905, "goods_sn": "SP0000130", "unit_name": "袋", "goods_name": "真空奶豆腐砖/甜味", "total_price": 34}, {"num": 2, "spec": "500g", "price": 17, "unit_id": 0, "goods_id": 906, "goods_sn": "SP0000129", "unit_name": "袋", "goods_name": "真空奶豆腐砖/原味", "total_price": 34}, {"num": 2, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 903, "goods_sn": "SP0000132", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/甜味", "total_price": 38}, {"num": 2, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 904, "goods_sn": "SP0000131", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/原味", "total_price": 38}]	从saas.mzth.cn导入 原单号:CG0002914	0	0		0		2026-03-30 17:38:18.788911	\N
275	CG202603307063	CG202603309408	116	恩赫奶制品厂	牧区纯坊官方品牌	2025-10-20	82.80	0.00	0.00	[{"num": 9.2, "spec": "250克/一袋", "price": 9, "unit_id": 0, "goods_id": 1015, "goods_sn": "SP0000019", "unit_name": "斤", "goods_name": "散装/原味奶条", "total_price": 82.8}]	从saas.mzth.cn导入 原单号:CG0002951	0	0		0		2026-03-30 17:38:08.209119	\N
274	CG202603305271	CG202603302477	116	恩赫奶制品厂	牧区纯坊官方品牌	2025-12-10	554.40	0.00	0.00	[{"num": 30.8, "spec": "250克/一袋", "price": 18, "unit_id": 0, "goods_id": 1015, "goods_sn": "SP0000019", "unit_name": "斤", "goods_name": "散装/原味奶条", "total_price": 554.4}]	从saas.mzth.cn导入 原单号:CG0002952	0	0		0		2026-03-30 17:38:07.087071	\N
273	CG202603304022	CG202603309430	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2025-12-10	550.00	0.00	0.00	[{"num": 100, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_sn": "SP0000021", "unit_name": "盒", "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 550}]	从saas.mzth.cn导入 原单号:CG0002953	0	0		0		2026-03-30 17:38:06.234715	\N
279	CG202603304854	CG202603302487	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-09	48.00	0.00	0.00	[{"num": 1, "spec": "10斤装/麻袋", "price": 48, "unit_id": 0, "goods_id": 923, "goods_sn": "SP0000112", "unit_name": "麻袋", "goods_name": "炒米/散装/硬口", "total_price": 48}]	从saas.mzth.cn导入 原单号:CG0002908	0	0		0		2026-03-30 17:38:21.020545	\N
282	CG202603302270	CG202603308230	93	杂/采购商	牧区纯坊官方品牌	2025-12-05	107.00	0.00	0.00	[{"num": 2, "spec": "400克", "price": 3.5, "unit_id": 0, "goods_id": 929, "goods_sn": "SP0000106", "unit_name": "袋", "goods_name": "白砂糖", "total_price": 7}, {"num": 1, "spec": "1", "price": 90, "unit_id": 0, "goods_id": 1002, "goods_sn": "SP0000032", "unit_name": "台", "goods_name": "封口机/真空", "total_price": 90}, {"num": 300, "spec": "大/中/小", "price": 0.03333, "unit_id": 0, "goods_id": 928, "goods_sn": "SP0000107", "unit_name": "袋", "goods_name": "塑料购物袋", "total_price": 10}]	从saas.mzth.cn导入 原单号:CG0002864	0	0		0		2026-03-30 17:38:29.363414	\N
286	CG202603308185	CG202603309946	121	盛大印刷	牧区纯坊官方品牌	2025-12-04	743.93	0.00	0.00	[{"num": 20000, "spec": "1", "price": 0.0265, "unit_id": 0, "goods_id": 979, "goods_sn": "SP0000055", "unit_name": "张", "goods_name": "新茶包/纸", "total_price": 530}, {"num": 500, "spec": "1", "price": 0.0682, "unit_id": 0, "goods_id": 1020, "goods_sn": "SP0000014", "unit_name": "张", "goods_name": "标签/不干胶/奶果子", "total_price": 34.1}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 950, "goods_sn": "SP0000085", "unit_name": "张", "goods_name": "透专标签/奶皮卷", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 951, "goods_sn": "SP0000084", "unit_name": "张", "goods_name": "透专标签/冻炒米", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 952, "goods_sn": "SP0000083", "unit_name": "张", "goods_name": "透专标签/奶酪/原味", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 953, "goods_sn": "SP0000082", "unit_name": "张", "goods_name": "透专标签/奶酪/甜味", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 954, "goods_sn": "SP0000081", "unit_name": "张", "goods_name": "透专标签/乳清奶条/甜味", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 955, "goods_sn": "SP0000080", "unit_name": "张", "goods_name": "透专标签/乳清奶条/原味", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 956, "goods_sn": "SP0000079", "unit_name": "张", "goods_name": "透专标签/鲜奶皮", "total_price": 25.69}]	从saas.mzth.cn导入 原单号:CG0002855	0	0		0		2026-03-30 17:38:37.728731	\N
285	CG202603301177	CG202603304446	101	拼多多/随机店采购	牧区纯坊官方品牌	2025-12-05	124.62	0.00	0.00	[{"num": 100, "spec": "500克装", "price": 0.7882, "unit_id": 0, "goods_id": 949, "goods_sn": "SP0000086", "unit_name": "张", "goods_name": "专袋/乌日莫/炒米", "total_price": 78.82}, {"num": 100, "spec": "250克装", "price": 0.458, "unit_id": 0, "goods_id": 948, "goods_sn": "SP0000087", "unit_name": "张", "goods_name": "专袋/乌日莫", "total_price": 45.8}]	从saas.mzth.cn导入 原单号:CG0002856	0	0		0		2026-03-30 17:38:33.280442	\N
284	CG202603304977	CG202603307774	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2025-12-05	220.00	0.00	0.00	[{"num": 40, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_sn": "SP0000021", "unit_name": "盒", "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 220}]	从saas.mzth.cn导入 原单号:CG0002857	0	0		0		2026-03-30 17:38:31.906489	\N
283	CG202603308245	CG202603304142	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-05	166.00	0.00	0.00	[{"num": 5, "spec": "500克", "price": 12, "unit_id": 0, "goods_id": 930, "goods_sn": "SP0000105", "unit_name": "袋", "goods_name": "加沙奶豆腐", "total_price": 60}, {"num": 10, "spec": "500g", "price": 4.8, "unit_id": 0, "goods_id": 931, "goods_sn": "SP0000104", "unit_name": "袋", "goods_name": "炒米粉/aag", "total_price": 48}, {"num": 10, "spec": "500克", "price": 5.8, "unit_id": 0, "goods_id": 932, "goods_sn": "SP0000103", "unit_name": "袋", "goods_name": "炒米海丰", "total_price": 58}]	从saas.mzth.cn导入 原单号:CG0002863	0	0		0		2026-03-30 17:38:31.062708	\N
294	CG202603306534	CG202603305569	99	淘宝/杂	牧区纯坊官方品牌	2025-12-01	925.00	0.00	0.00	[{"num": 5000, "spec": "1", "price": 0.185, "unit_id": 0, "goods_id": 982, "goods_sn": "SP0000052", "unit_name": "个", "goods_name": "塑料手提袋", "total_price": 925}]	从saas.mzth.cn导入 原单号:CG0002794	0	0		0		2026-03-30 17:38:52.547779	\N
299	CG202603308382	CG202603307832	106	拼多多/热缩膜	牧区纯坊官方品牌	2025-11-16	245.49	0.00	0.00	[{"num": 2600.0, "spec": "0", "price": 0.09442, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "茶专用/热缩膜", "total_price": 245.49}]	从saas.mzth.cn导入 原单号:CG0002606	0	0		0		2026-03-30 17:38:59.333737	2026-03-31 02:33:35.413743
298	CG202603305495	CG202603304899	101	拼多多/随机店采购	牧区纯坊官方品牌	2025-11-16	38.00	0.00	0.00	[{"num": 1.0, "spec": "1", "price": 38.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "台", "goods_name": "封口机/真空", "total_price": 38.0}]	从saas.mzth.cn导入 原单号:CG0002607	0	0		0		2026-03-30 17:38:58.476197	2026-03-31 02:33:35.918094
297	CG202603309640	CG202603306711	101	拼多多/随机店采购	牧区纯坊官方品牌	2025-11-16	2800.00	0.00	0.00	[{"num": 1.0, "spec": "1", "price": 2800.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "台", "goods_name": "冷冻柜/冰箱", "total_price": 2800.0}]	从saas.mzth.cn导入 原单号:CG0002608	0	0		0		2026-03-30 17:38:57.614513	2026-03-31 02:33:36.425981
293	CG202603305508	CG202603308324	118	淘宝/江苏永发玻璃制品厂	牧区纯坊官方品牌	2025-12-01	648.00	0.00	0.00	[{"num": 240, "spec": "100ML", "price": 1.8, "unit_id": 0, "goods_id": 1016, "goods_sn": "SP0000018", "unit_name": "瓶", "goods_name": "专瓶/黄油", "total_price": 432}, {"num": 120, "spec": "120mL", "price": 1.8, "unit_id": 0, "goods_id": 862, "goods_sn": "SP0000173", "unit_name": "瓶", "goods_name": "专瓶/黄油渣", "total_price": 216}]	从saas.mzth.cn导入 原单号:CG0002797	0	0		0		2026-03-30 17:38:51.668561	\N
292	CG202603308801	CG202603302479	105	翁牛特旗奶果子	牧区纯坊官方品牌	2025-11-30	2146.00	0.00	0.00	[{"num": 85.84, "spec": "平均一块儿", "price": 25, "unit_id": 0, "goods_id": 991, "goods_sn": "SP0000043", "unit_name": "斤", "goods_name": "奶果子/散装", "total_price": 2146}]	从saas.mzth.cn导入 原单号:CG0002800	0	0		0		2026-03-30 17:38:50.154213	\N
291	CG202603306186	CG202603309079	120	淘宝紫辰包装	牧区纯坊官方品牌	2025-12-01	70.40	0.00	0.00	[{"num": 500, "spec": "1", "price": 0.1408, "unit_id": 0, "goods_id": 1027, "goods_sn": "SP0000007", "unit_name": "张", "goods_name": "真空袋", "total_price": 70.4}]	从saas.mzth.cn导入 原单号:CG0002801	0	0		0		2026-03-30 17:38:49.198889	\N
290	CG202603306057	CG202603302845	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-04	154.00	0.00	0.00	[{"num": 7, "spec": "斤/两盒", "price": 22, "unit_id": 0, "goods_id": 981, "goods_sn": "SP0000053", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 154}]	从saas.mzth.cn导入 原单号:CG0002847	0	0		0		2026-03-30 17:38:48.303052	\N
289	CG202603304535	CG202603308699	97	纯净奶食品	牧区纯坊官方品牌	2025-12-03	2359.60	0.00	0.00	[{"num": 10, "spec": "45散称/斤/9元/100克", "price": 45, "unit_id": 0, "goods_id": 972, "goods_sn": "SP0000062", "unit_name": "斤", "goods_name": "原味/散称/奶豆腐块儿", "total_price": 450}, {"num": 10, "spec": "45散称/斤/9元/100克", "price": 45, "unit_id": 0, "goods_id": 971, "goods_sn": "SP0000063", "unit_name": "斤", "goods_name": "甜味/散称/奶豆腐块儿", "total_price": 450}, {"num": 38, "spec": "140克", "price": 4.2, "unit_id": 0, "goods_id": 965, "goods_sn": "SP0000069", "unit_name": "盒", "goods_name": "半成品/透明/冻炒米", "total_price": 159.6}, {"num": 50, "spec": "200克", "price": 10, "unit_id": 0, "goods_id": 970, "goods_sn": "SP0000064", "unit_name": "盒", "goods_name": "热奶豆腐碗", "total_price": 500}, {"num": 30, "spec": "150-180克", "price": 13, "unit_id": 0, "goods_id": 968, "goods_sn": "SP0000066", "unit_name": "张", "goods_name": "大/奶皮", "total_price": 390}, {"num": 30, "spec": "120-150克", "price": 10, "unit_id": 0, "goods_id": 969, "goods_sn": "SP0000065", "unit_name": "张", "goods_name": "小/奶皮", "total_price": 300}, {"num": 5, "spec": "4斤装", "price": 4, "unit_id": 0, "goods_id": 967, "goods_sn": "SP0000067", "unit_name": "桶", "goods_name": "查嘎/乳清", "total_price": 20}, {"num": 30, "spec": "50克", "price": 3, "unit_id": 0, "goods_id": 966, "goods_sn": "SP0000068", "unit_name": "小包", "goods_name": "查嘎粉/小包装袋", "total_price": 90}]	从saas.mzth.cn导入 原单号:CG0002851	0	0		0		2026-03-30 17:38:46.987643	\N
317	CG202603305909	CG202603309894	107	拼多多/木勺	牧区纯坊官方品牌	2025-10-01	63.96	0.00	0.00	[{"num": 2.0, "spec": "袋100个/平均价0.1599", "price": 15.99, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "捆", "goods_name": "木勺", "total_price": 31.98}, {"num": 200.0, "spec": "袋100个/平均价0.1599", "price": 0.1599, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "个", "goods_name": "木勺", "total_price": 31.98}]	从saas.mzth.cn导入 原单号:CG0002153	0	0		0		2026-03-30 17:39:18.071717	2026-03-31 02:33:25.28501
316	CG202603305728	CG202603305742	121	盛大印刷	牧区纯坊官方品牌	2025-10-01	360.00	0.00	0.00	[{"num": 1000.0, "spec": "0", "price": 0.32, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "茶专用/硫酸纸", "total_price": 320.0}, {"num": 1000.0, "spec": "0", "price": 0.04, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "茶专用/不干胶/标签", "total_price": 40.0}]	从saas.mzth.cn导入 原单号:CG0002154	0	0		0		2026-03-30 17:39:16.489793	2026-03-31 02:33:26.028203
315	CG202603302541	CG202603306428	106	拼多多/热缩膜	牧区纯坊官方品牌	2025-10-01	100.00	0.00	0.00	[{"num": 10.0, "spec": "0", "price": 10.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "捆", "goods_name": "茶专用/热缩膜", "total_price": 100.0}]	从saas.mzth.cn导入 原单号:CG0002173	0	0		0		2026-03-30 17:39:15.244365	2026-03-31 02:33:26.523471
314	CG202603309815	CG202603308418	123	银河包装	牧区纯坊官方品牌	2025-10-01	400.00	0.00	0.00	[{"num": 200.0, "spec": "1", "price": 2.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专盒/青砖奶茶外盒", "total_price": 400.0}]	从saas.mzth.cn导入 原单号:CG0002174	0	0		0		2026-03-30 17:39:14.36384	2026-03-31 02:33:27.036118
313	CG202603301825	CG202603309775	106	拼多多/热缩膜	牧区纯坊官方品牌	2025-10-01	50.00	0.00	0.00	[{"num": 500.0, "spec": "1", "price": 0.1, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "冻炒米专用/塑膜袋", "total_price": 50.0}]	从saas.mzth.cn导入 原单号:CG0002175	0	0		0		2026-03-30 17:39:13.511695	2026-03-31 02:33:27.581085
312	CG202603302609	CG202603304483	105	翁牛特旗奶果子	牧区纯坊官方品牌	2025-10-01	456.00	0.00	0.00	[{"num": 18.24, "spec": "平均一块儿", "price": 25.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "奶果子/散装", "total_price": 456.0}]	从saas.mzth.cn导入 原单号:CG0002176	0	0		0		2026-03-30 17:39:12.663555	2026-03-31 02:33:28.078208
311	CG202603309140	CG202603303218	106	拼多多/热缩膜	牧区纯坊官方品牌	2025-10-01	100.00	0.00	0.00	[{"num": 1000.0, "spec": "1", "price": 0.1, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "奶果子/专用塑膜袋", "total_price": 100.0}]	从saas.mzth.cn导入 原单号:CG0002177	0	0		0		2026-03-30 17:39:11.817691	2026-03-31 02:33:28.599925
310	CG202603302691	CG202603301175	105	翁牛特旗奶果子	牧区纯坊官方品牌	2025-10-01	360.00	0.00	0.00	[{"num": 14.4, "spec": "平均一块儿", "price": 25.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "奶果子/散装", "total_price": 360.0}]	从saas.mzth.cn导入 原单号:CG0002178	0	0		0		2026-03-30 17:39:10.977029	2026-03-31 02:33:29.199837
309	CG202603301210	CG202603304714	112	广州维记	牧区纯坊官方品牌	2025-10-26	1820.00	0.00	0.00	[{"num": 10.0, "spec": "400/箱/0.423/球", "price": 182.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "件", "goods_name": "奶油球", "total_price": 1820.0}]	从saas.mzth.cn导入 原单号:CG0002219	0	0		0		2026-03-30 17:39:10.120557	2026-03-31 02:33:29.844464
308	CG202603302218	CG202603304954	104	锡盟艾润萨利SC	牧区纯坊官方品牌	2025-10-26	470.00	0.00	0.00	[{"num": 14.0, "spec": "不定具体产品", "price": 33.57143, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "采购样品专用/乳制品", "total_price": 470.0}]	从saas.mzth.cn导入 原单号:CG0002220	0	0		0		2026-03-30 17:39:09.29695	2026-03-31 02:33:30.349746
307	CG202603307057	CG202603308131	114	阿旗北方	牧区纯坊官方品牌	2025-10-31	16.50	0.00	0.00	[{"num": 3.0, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "盒", "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 16.5}]	从saas.mzth.cn导入 原单号:CG0002415	0	0		0		2026-03-30 17:39:08.427591	2026-03-31 02:33:30.848044
306	CG202603308589	CG202603305303	116	恩赫奶制品厂	牧区纯坊官方品牌	2025-10-20	284.40	0.00	0.00	[{"num": 15.8, "spec": "250克/一袋", "price": 18.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "散装/原味奶条", "total_price": 284.4}]	从saas.mzth.cn导入 原单号:CG0002417	0	0		0		2026-03-30 17:39:07.351234	2026-03-31 02:33:31.337066
305	CG202603303608	CG202603304341	108	山东锦食食品	牧区纯坊官方品牌	2025-11-01	550.00	0.00	0.00	[{"num": 8.0, "spec": "2g", "price": 68.75, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "件", "goods_name": "茶专用/盐包", "total_price": 550.0}]	从saas.mzth.cn导入 原单号:CG0002418	0	0		0		2026-03-30 17:39:06.315597	2026-03-31 02:33:31.82495
304	CG202603301409	CG202603308891	114	阿旗北方	牧区纯坊官方品牌	2025-11-01	46.80	0.00	0.00	[{"num": 1.0, "spec": "100克", "price": 7.08, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "瓶", "goods_name": "蒙古黄油/瓶装成品", "total_price": 7.08}, {"num": 2.0, "spec": "100克", "price": 7.08, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "瓶", "goods_name": "蒙古黄油/瓶装成品", "total_price": 14.16}, {"num": 2.0, "spec": "150", "price": 12.78, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "原味传统奶豆腐/成品袋装", "total_price": 25.56}]	从saas.mzth.cn导入 原单号:CG0002419	0	0		0		2026-03-30 17:39:05.192211	2026-03-31 02:33:32.325451
337	CG202603301049	CG202603306829	120	淘宝紫辰包装	牧区纯坊官方品牌	2025-09-30	49.50	0.00	0.00	[{"num": 90.0, "spec": "1", "price": 0.55, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专袋/传统奶豆腐", "total_price": 49.5}]	从saas.mzth.cn导入 原单号:CG0002009	0	0		0		2026-03-30 17:39:50.474869	2026-03-31 02:33:13.791518
336	CG202603304305	CG202603308822	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	1.74	0.00	0.00	[{"num": 14.0, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 0.84}, {"num": 15.0, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 0.9}]	从saas.mzth.cn导入 原单号:CG0002010	0	0		0		2026-03-30 17:39:49.618475	2026-03-31 02:33:14.301873
335	CG202603305125	CG202603307772	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	0.39	0.00	0.00	[{"num": 13.0, "spec": "1", "price": 0.03, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "标签/不干胶/奶果子", "total_price": 0.39}]	从saas.mzth.cn导入 原单号:CG0002011	0	0		0		2026-03-30 17:39:48.161207	2026-03-31 02:33:14.816547
334	CG202603306671	CG202603301183	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	1469.00	0.00	0.00	[{"num": 500.0, "spec": "1", "price": 0.067, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "标签/不干胶/冻炒米", "total_price": 33.5}, {"num": 1650.0, "spec": "1", "price": 0.87, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专盒/冻炒米", "total_price": 1435.5}]	从saas.mzth.cn导入 原单号:CG0002012	0	0		0		2026-03-30 17:39:47.328563	2026-03-31 02:33:15.303867
333	CG202603303652	CG202603308790	119	沈阳乾兴包装	牧区纯坊官方品牌	2025-09-30	254.80	0.00	0.00	[{"num": 30.0, "spec": "1", "price": 4.55, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "礼盒/蓝界", "total_price": 136.5}, {"num": 26.0, "spec": "1", "price": 4.55, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "礼盒/蓝界", "total_price": 118.3}]	从saas.mzth.cn导入 原单号:CG0002013	0	0		0		2026-03-30 17:39:46.061768	2026-03-31 02:33:15.804879
331	CG202603306083	CG202603308488	123	银河包装	牧区纯坊官方品牌	2025-09-30	5751.26	0.00	0.00	[{"num": 17.0, "spec": "1", "price": 35.5, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "捆", "goods_name": "专袋/奶条", "total_price": 603.5}, {"num": 16.0, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 11.36}, {"num": 47.0, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 33.37}, {"num": 7.0, "spec": "1", "price": 35.5, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "捆", "goods_name": "专袋/奶条", "total_price": 248.5}, {"num": 79.0, "spec": "1", "price": 18.5, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "捆", "goods_name": "专底盒/奶条", "total_price": 1461.5}, {"num": 33.0, "spec": "1", "price": 0.37, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专底盒/奶条", "total_price": 12.21}, {"num": 6.0, "spec": "1", "price": 0.65, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专外盒/奶果子", "total_price": 3.9}, {"num": 34.0, "spec": "1", "price": 32.5, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "捆", "goods_name": "专外盒/奶果子", "total_price": 1105.0}, {"num": 24.0, "spec": "1", "price": 0.65, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专内盒/奶果子", "total_price": 15.6}, {"num": 37.0, "spec": "1", "price": 26.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "捆", "goods_name": "专内盒/奶果子", "total_price": 962.0}, {"num": 25.0, "spec": "1", "price": 0.08, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专内袋/奶果子", "total_price": 2.0}, {"num": 82.0, "spec": "1", "price": 15.76, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "捆", "goods_name": "专内袋/奶果子", "total_price": 1292.32}]	从saas.mzth.cn导入 原单号:CG0002015	0	0		0		2026-03-30 17:39:41.011585	2026-03-31 02:33:16.801342
330	CG202603301015	CG202603305869	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	66.66	0.00	0.00	[{"num": 748.0, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 44.88}, {"num": 9.0, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 0.54}, {"num": 260.0, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 15.6}, {"num": 76.0, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 4.56}, {"num": 18.0, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 1.08}]	从saas.mzth.cn导入 原单号:CG0002016	0	0		0		2026-03-30 17:39:35.371602	2026-03-31 02:33:17.301488
329	CG202603309579	CG202603309590	120	淘宝紫辰包装	牧区纯坊官方品牌	2025-09-30	56.10	0.00	0.00	[{"num": 79.0, "spec": "1", "price": 0.55, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专袋/传统奶豆腐", "total_price": 43.45}, {"num": 23.0, "spec": "1", "price": 0.55, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专袋/传统奶豆腐", "total_price": 12.65}]	从saas.mzth.cn导入 原单号:CG0002017	0	0		0		2026-03-30 17:39:32.516139	2026-03-31 02:33:17.864759
344	CG202603307682	CG202603302594	123	银河包装	牧区纯坊官方品牌	2025-09-30	66.60	0.00	0.00	[{"num": 30.0, "spec": "1", "price": 0.37, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专底盒/奶条", "total_price": 11.1}, {"num": 3.0, "spec": "1", "price": 18.5, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "捆", "goods_name": "专底盒/奶条", "total_price": 55.5}]	从saas.mzth.cn导入 原单号:CG0002002	0	0		0		2026-03-30 17:39:58.477924	2026-03-31 02:33:09.855052
346	CG202603303754	CG202603301487	123	银河包装	牧区纯坊官方品牌	2025-09-30	200.93	0.00	0.00	[{"num": 51.0, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 36.21}, {"num": 84.0, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 59.64}, {"num": 2.0, "spec": "1", "price": 35.5, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "捆", "goods_name": "专袋/奶条", "total_price": 71.0}, {"num": 48.0, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 34.08}]	从saas.mzth.cn导入 原单号:CG0002000	1	0		0		2026-03-30 17:40:01.538746	2026-03-31 02:33:08.833149
345	CG202603303598	CG202603309552	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	27.84	0.00	0.00	[{"num": 32.0, "spec": "1", "price": 0.87, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专盒/冻炒米", "total_price": 27.84}]	从saas.mzth.cn导入 原单号:CG0002001	0	0		0		2026-03-30 17:39:59.349881	2026-03-31 02:33:09.318317
343	CG202603304271	CG202603303907	123	银河包装	牧区纯坊官方品牌	2025-09-30	9.10	0.00	0.00	[{"num": 8.0, "spec": "1", "price": 0.65, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专内盒/奶果子", "total_price": 5.2}, {"num": 6.0, "spec": "1", "price": 0.65, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专外盒/奶果子", "total_price": 3.9}]	从saas.mzth.cn导入 原单号:CG0002003	0	0		0		2026-03-30 17:39:57.202155	2026-03-31 02:33:10.38699
342	CG202603302578	CG202603306594	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	0.96	0.00	0.00	[{"num": 16.0, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专标签/黄油", "total_price": 0.96}]	从saas.mzth.cn导入 原单号:CG0002004	0	0		0		2026-03-30 17:39:55.959776	2026-03-31 02:33:10.873232
341	CG202603309505	CG202603305604	120	淘宝紫辰包装	牧区纯坊官方品牌	2025-09-30	10.20	0.00	0.00	[{"num": 60.0, "spec": "1", "price": 0.17, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "真空袋", "total_price": 10.2}]	从saas.mzth.cn导入 原单号:CG0002005	0	0		0		2026-03-30 17:39:55.137023	2026-03-31 02:33:11.384914
340	CG202603306235	CG202603301125	123	银河包装	牧区纯坊官方品牌	2025-09-30	206.16	0.00	0.00	[{"num": 16.0, "spec": "1", "price": 0.08, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专内袋/奶果子", "total_price": 1.28}, {"num": 13.0, "spec": "1", "price": 15.76, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "捆", "goods_name": "专内袋/奶果子", "total_price": 204.88}]	从saas.mzth.cn导入 原单号:CG0002006	0	0		0		2026-03-30 17:39:54.307477	2026-03-31 02:33:11.885643
339	CG202603306590	CG202603309925	122	沈阳东源包材厂	牧区纯坊官方品牌	2025-09-30	2381.12	0.00	0.00	[{"num": 16.0, "spec": "1", "price": 0.07, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "定制款/专内袋/扎那家奶果子", "total_price": 1.12}, {"num": 170.0, "spec": "1", "price": 14.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "捆", "goods_name": "定制款/专内袋/扎那家奶果子", "total_price": 2380.0}]	从saas.mzth.cn导入 原单号:CG0002007	0	0		0		2026-03-30 17:39:53.062851	2026-03-31 02:33:12.381004
338	CG202603301881	CG202603302290	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	5.20	0.00	0.00	[{"num": 77.0, "spec": "1", "price": 0.05, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "标签/不干胶/奶条/甜味", "total_price": 3.85}, {"num": 27.0, "spec": "1", "price": 0.05, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "标签/不干胶/奶条/原味", "total_price": 1.35}]	从saas.mzth.cn导入 原单号:CG0002008	0	0		0		2026-03-30 17:39:51.834401	2026-03-31 02:33:13.258733
332	CG202603306897	CG202603301198	123	银河包装	牧区纯坊官方品牌	2025-09-30	6580.05	0.00	0.00	[{"num": 368.0, "spec": "1", "price": 0.94, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "手提袋", "total_price": 345.92}, {"num": 80.0, "spec": "1", "price": 35.5, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "捆", "goods_name": "专袋/奶条", "total_price": 2840.0}, {"num": 20.0, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 14.2}, {"num": 86.0, "spec": "1", "price": 35.5, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "捆", "goods_name": "专袋/奶条", "total_price": 3053.0}, {"num": 5.0, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 3.55}, {"num": 17.0, "spec": "1", "price": 18.5, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "捆", "goods_name": "专底盒/奶条", "total_price": 314.5}, {"num": 24.0, "spec": "1", "price": 0.37, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专底盒/奶条", "total_price": 8.88}]	从saas.mzth.cn导入 原单号:CG0002014	0	0		0		2026-03-30 17:39:44.426575	2026-03-31 02:33:16.297277
328	CG202603301622	CG202603302044	120	淘宝紫辰包装	牧区纯坊官方品牌	2025-09-30	3.40	0.00	0.00	[{"num": 20.0, "spec": "1", "price": 0.17, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "真空袋", "total_price": 3.4}]	从saas.mzth.cn导入 原单号:CG0002018	0	0		0		2026-03-30 17:39:31.045065	2026-03-31 02:33:18.376853
327	CG202603304277	CG202603301099	118	淘宝/江苏永发玻璃制品厂	牧区纯坊官方品牌	2025-09-30	89.10	0.00	0.00	[{"num": 55.0, "spec": "100ML", "price": 1.62, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "瓶", "goods_name": "专瓶/黄油", "total_price": 89.1}]	从saas.mzth.cn导入 原单号:CG0002019	0	0		0		2026-03-30 17:39:30.230645	2026-03-31 02:33:18.873046
326	CG202603308750	CG202603308783	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	970.45	0.00	0.00	[{"num": 36.0, "spec": "1", "price": 0.87, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专盒/冻炒米", "total_price": 31.32}, {"num": 20.0, "spec": "1", "price": 43.5, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "捆", "goods_name": "专盒/冻炒米", "total_price": 870.0}, {"num": 298.0, "spec": "1", "price": 0.05, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "标签/不干胶/奶条/原味", "total_price": 14.9}, {"num": 111.0, "spec": "1", "price": 0.03, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "标签/不干胶/奶果子", "total_price": 3.33}, {"num": 340.0, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专标签/黄油", "total_price": 20.4}, {"num": 500.0, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "专标签/黄油", "total_price": 30.0}, {"num": 10.0, "spec": "1", "price": 0.05, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "标签/不干胶/奶条/甜味", "total_price": 0.5}]	从saas.mzth.cn导入 原单号:CG0002020	0	0		0		2026-03-30 17:39:29.38741	2026-03-31 02:33:19.566627
318	CG202603303044	CG202603303673	108	山东锦食食品	牧区纯坊官方品牌	2025-10-01	151.10	0.00	0.00	[{"num": 2.0, "spec": "2g", "price": 68.75, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "件", "goods_name": "茶专用/盐包", "total_price": 137.5}, {"num": 200.0, "spec": "2g", "price": 0.068, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "小包", "goods_name": "茶专用/盐包", "total_price": 13.6}]	从saas.mzth.cn导入 原单号:CG0002152	0	0		0		2026-03-30 17:39:19.461704	2026-03-31 02:33:24.756578
302	CG202603306492	CG202603304436	112	广州维记	牧区纯坊官方品牌	2025-11-07	1817.00	0.00	0.00	[{"num": 10.0, "spec": "400/箱/0.423/球", "price": 181.7, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "件", "goods_name": "奶油球", "total_price": 1817.0}]	从saas.mzth.cn导入 原单号:CG0002603	0	0		0		2026-03-30 17:39:02.149127	2026-03-31 02:33:33.320178
301	CG202603301607	CG202603304216	117	巴音珠萨朗	牧区纯坊官方品牌	2025-11-16	357.00	0.00	0.00	[{"num": 21.0, "spec": "250克/一袋", "price": 17.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "散装/甜味奶条", "total_price": 357.0}]	从saas.mzth.cn导入 原单号:CG0002604	0	0		0		2026-03-30 17:39:01.187209	2026-03-31 02:33:34.153566
300	CG202603304579	CG202603302843	107	拼多多/木勺	牧区纯坊官方品牌	2025-11-16	159.90	0.00	0.00	[{"num": 10.0, "spec": "袋100个/平均价0.1599", "price": 15.99, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "捆", "goods_name": "木勺", "total_price": 159.9}]	从saas.mzth.cn导入 原单号:CG0002605	0	0		0		2026-03-30 17:39:00.153	2026-03-31 02:33:34.644853
246	CG202603303492	CG202603303853	113	永巨茶业	牧区纯坊官方品牌	2025-12-29	1388.00	0.00	0.00	[{"num": 1.0, "spec": "1.5kg", "price": 273.05, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "件", "goods_name": "大青砖茶砖", "total_price": 273.05}, {"num": 1.0, "spec": "380g", "price": 227.54, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "件", "goods_name": "小青砖茶砖", "total_price": 227.54}, {"num": 1.0, "spec": "450g", "price": 204.79, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "件", "goods_name": "青砖碎茶", "total_price": 204.79}, {"num": 1.0, "spec": "5g/袋泡茶/30泡", "price": 477.83, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "件", "goods_name": "5g/青砖袋泡茶", "total_price": 477.83}, {"num": 1.0, "spec": "450g/25袋", "price": 204.79, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "件", "goods_name": "16g青砖袋泡茶", "total_price": 204.79}]	从saas.mzth.cn导入 原单号:CG0003427	0	0		0		2026-03-30 17:37:26.840652	2026-03-31 02:33:37.495165
236	CG202603305438	CG202603303278	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-11	50.00	0.00	0.00	[{"num": 10.0, "spec": "斤", "price": 5.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 50.0}]	从saas.mzth.cn导入 原单号:CG0003704	0	0		0		2026-03-30 17:37:12.786988	2026-03-31 02:33:43.298267
232	CG202603305505	CG202603302660	90	阿润查干	牧区纯坊官方品牌	2026-01-16	680.00	0.00	0.00	[{"num": 10.0, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "盒", "goods_name": "干肉奶茶", "total_price": 55.0}, {"num": 25.0, "spec": "奶油炒米/ 黑芝麻/ 乌日莫糖/ 酸奶炒米/ 奶油花生", "price": 25.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "4030", "goods_name": "糖/阿润", "total_price": 625.0}]	从saas.mzth.cn导入 原单号:CG0003838	0	0		0		2026-03-30 17:37:08.999836	2026-03-31 02:33:45.682258
223	CG202603305705	CG202603304969	82	阿齐图/巴林右旗	牧区纯坊官方品牌	2026-01-20	1470.00	0.00	0.00	[{"num": 5.0, "spec": "孜然", "price": 98.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "牛肉干/散/孜然", "total_price": 490.0}, {"num": 5.0, "spec": "香辣", "price": 98.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "牛肉干/散/香辣", "total_price": 490.0}, {"num": 5.0, "spec": "原味", "price": 98.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "牛肉干/散/原味", "total_price": 490.0}]	从saas.mzth.cn导入 原单号:CG0003935	0	0		0		2026-03-30 17:36:58.848545	2026-03-31 02:33:51.235556
219	CG202603303565	CG202603307433	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-24	400.00	0.00	0.00	[{"num": 5.0, "spec": "1斤散称", "price": 22.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "乌日莫糖/散装", "total_price": 110.0}, {"num": 5.0, "spec": "1斤散称", "price": 10.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "酸奶炒米糖/散装", "total_price": 50.0}, {"num": 5.0, "spec": "1斤散称", "price": 15.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 75.0}, {"num": 5.0, "spec": "1.2", "price": 33.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "科尔沁/大奶豆腐", "total_price": 165.0}]	从saas.mzth.cn导入 原单号:CG0004043	0	0		0		2026-03-30 17:36:54.395423	2026-03-31 02:33:53.279674
210	CG202603304307	CG202603304067	84	兴安盟杭盖奶制品厂	牧区纯坊官方品牌	2026-02-04	380.00	0.00	0.00	[{"num": 20.0, "spec": "1", "price": 19.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "厚奶皮", "total_price": 380.0}]	从saas.mzth.cn导入 原单号:CG0004287	0	0		0		2026-03-30 17:36:36.183067	2026-03-31 02:33:58.480992
208	CG202603309205	CG202603308073	78	小米厂家阿旗	牧区纯坊官方品牌	2026-02-08	573.00	0.00	0.00	[{"num": 2.0, "spec": "2.5kg", "price": 19.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "小米/10斤/小袋", "total_price": 38.0}, {"num": 5.0, "spec": "2.5kg", "price": 19.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "小米/10斤/小袋", "total_price": 95.0}, {"num": 8.0, "spec": "10斤装", "price": 55.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "盒", "goods_name": "10斤装/小米/绿色纸盒", "total_price": 440.0}]	从saas.mzth.cn导入 原单号:CG0004363	0	0		0		2026-03-30 17:36:34.177201	2026-03-31 02:33:59.527921
207	CG202603308065	CG202603302465	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-09	95.00	0.00	0.00	[{"num": 5.0, "spec": "1", "price": 19.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "奶豆腐/原味/中/科尔沁", "total_price": 95.0}]	从saas.mzth.cn导入 原单号:CG0004368	0	0		0		2026-03-30 17:36:32.181325	2026-03-31 02:34:00.041669
204	CG202603307443	CG202603302623	76	乌日汗奶食品店	1号店员专用	2026-02-10	90.00	0.00	0.00	[{"num": 3.0, "spec": "300ml", "price": 15.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "盒", "goods_name": "故乡宝酸马奶", "total_price": 45.0}, {"num": 5.0, "spec": "500克", "price": 9.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "盒", "goods_name": "乌日汗酸奶", "total_price": 45.0}]	从saas.mzth.cn导入 原单号:CG0004387	0	0		0		2026-03-30 17:36:29.564615	2026-03-31 02:34:01.696645
202	CG202603308242	CG202603302820	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-14	965.00	0.00	0.00	[{"num": 2.0, "spec": "1斤", "price": 95.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "风干牛肉500g大片", "total_price": 190.0}, {"num": 10.0, "spec": "半斤", "price": 14.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "脆奶条/散装/科尔沁", "total_price": 140.0}, {"num": 5.0, "spec": "500g", "price": 19.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/甜味", "total_price": 95.0}, {"num": 5.0, "spec": "500g", "price": 19.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/原味", "total_price": 95.0}, {"num": 5.0, "spec": "半斤装", "price": 15.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "瓶", "goods_name": "黄油/中瓶", "total_price": 75.0}, {"num": 5.0, "spec": "半斤装", "price": 21.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "瓶", "goods_name": "黄油/大瓶/科尔沁", "total_price": 105.0}, {"num": 5.0, "spec": "1", "price": 19.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "张", "goods_name": "奶豆腐/原味/中/科尔沁", "total_price": 95.0}, {"num": 2.0, "spec": "1斤", "price": 85.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "哈斯乌拉牛肉干500g原味", "total_price": 170.0}]	从saas.mzth.cn导入 原单号:CG0004417	0	0		0		2026-03-30 17:36:27.350406	2026-03-31 02:34:03.02639
198	CG202603301883	CG202603304110	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-23	858.00	0.00	0.00	[{"num": 5.0, "spec": "1斤", "price": 95.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "风干牛肉500g大片", "total_price": 475.0}, {"num": 5.0, "spec": "1斤散称", "price": 15.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 75.0}, {"num": 20.0, "spec": "500克", "price": 5.5, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "炒米海丰", "total_price": 110.0}, {"num": 10.0, "spec": "500g", "price": 4.8, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "袋", "goods_name": "炒米粉/aag", "total_price": 48.0}, {"num": 10.0, "spec": "半斤装", "price": 15.0, "unit_id": 0, "goods_id": 0, "goods_sn": "", "unit_name": "瓶", "goods_name": "黄油/中瓶", "total_price": 150.0}]	从saas.mzth.cn导入 原单号:CG0004429	0	0		0		2026-03-30 17:36:19.079358	2026-03-31 02:34:05.176329
348	CG202603318189	CG202603314884	98	科尔沁奶食品	1号店员专用	2026-03-01	50.00	0.00	0.00	[{"num": 10, "spec": "斤", "price": 5, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0004472	0	0		0		2026-03-31 02:34:11.311651	\N
353	CG202603318392	CG202603315198	74	德吉奶食品	1号店员专用	2026-02-26	270.00	0.00	0.00	[{"num": 10, "spec": "1L", "price": 15, "unit_id": 0, "goods_id": 804, "goods_sn": "SP0000232", "unit_name": "瓶", "goods_name": "德吉酸奶/2斤装", "total_price": 150}, {"num": 10, "spec": "500mL", "price": 8, "unit_id": 0, "goods_id": 805, "goods_sn": "SP0000231", "unit_name": "瓶", "goods_name": "德吉酸奶/一斤装", "total_price": 80}, {"num": 10, "spec": "250mL", "price": 4, "unit_id": 0, "goods_id": 806, "goods_sn": "SP0000230", "unit_name": "瓶", "goods_name": "德吉酸奶/半斤", "total_price": 40}]	从saas.mzth.cn导入 原单号:CG0004475	0	0		0		2026-03-31 02:34:18.458981	\N
352	CG202603311066	CG202603312498	84	兴安盟杭盖奶制品厂	牧区纯坊官方品牌	2026-02-27	380.00	0.00	0.00	[{"num": 20, "spec": "1", "price": 19, "unit_id": 0, "goods_id": 857, "goods_sn": "SP0000178", "unit_name": "张", "goods_name": "厚奶皮", "total_price": 380}]	从saas.mzth.cn导入 原单号:CG0004457	0	0		0		2026-03-31 02:34:16.474763	\N
350	CG202603318570	CG202603315478	98	科尔沁奶食品	1号店员专用	2026-03-01	75.00	0.00	0.00	[{"num": 5, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 75}]	从saas.mzth.cn导入 原单号:CG0004470	0	0		0		2026-03-31 02:34:13.340438	\N
359	CG202603312202	CG202603313525	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-12	145.00	0.00	0.00	[{"num": 30, "spec": "10斤装/麻袋", "price": 4.83333, "unit_id": 0, "goods_id": 923, "goods_sn": "SP0000112", "unit_name": "斤", "goods_name": "炒米/散装/硬口", "total_price": 145}]	从saas.mzth.cn导入 原单号:CG0004414	0	0		0		2026-03-31 02:34:32.772404	\N
357	CG202603318133	CG202603315658	75	格日勒	牧区纯坊官方品牌	2026-02-23	100.00	0.00	0.00	[{"num": 12, "spec": "250克", "price": 8.33333, "unit_id": 0, "goods_id": 811, "goods_sn": "SP0000225", "unit_name": "袋", "goods_name": "蒙古果子/格日勒", "total_price": 100}]	从saas.mzth.cn导入 原单号:CG0004426	0	0		0		2026-03-31 02:34:26.520109	\N
356	CG202603311777	CG202603311285	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-23	850.00	0.00	0.00	[{"num": 10, "spec": "1斤", "price": 85, "unit_id": 0, "goods_id": 908, "goods_sn": "SP0000127", "unit_name": "袋", "goods_name": "哈斯乌拉牛肉干500g原味", "total_price": 850}]	从saas.mzth.cn导入 原单号:CG0004427	0	0		0		2026-03-31 02:34:25.506824	\N
355	CG202603314534	CG202603313612	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-23	450.00	0.00	0.00	[{"num": 5, "spec": "1.2", "price": 33, "unit_id": 0, "goods_id": 856, "goods_sn": "SP0000179", "unit_name": "张", "goods_name": "科尔沁/大奶豆腐", "total_price": 165}, {"num": 5, "spec": "1", "price": 19, "unit_id": 0, "goods_id": 829, "goods_sn": "SP0000207", "unit_name": "张", "goods_name": "奶豆腐/原味/中/科尔沁", "total_price": 95}, {"num": 5, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 903, "goods_sn": "SP0000132", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/甜味", "total_price": 95}, {"num": 5, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 904, "goods_sn": "SP0000131", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/原味", "total_price": 95}]	从saas.mzth.cn导入 原单号:CG0004428	0	0		0		2026-03-31 02:34:24.513226	\N
366	CG202603312071	CG202603314910	84	兴安盟杭盖奶制品厂	牧区纯坊官方品牌	2026-02-04	380.00	0.00	0.00	[{"num": 20, "spec": "1", "price": 19, "unit_id": 0, "goods_id": 857, "goods_sn": "SP0000178", "unit_name": "张", "goods_name": "厚奶皮", "total_price": 380}]	从saas.mzth.cn导入 原单号:CG0004287	0	0		0		2026-03-31 02:34:47.75935	\N
365	CG202603317293	CG202603317708	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-04	50.00	0.00	0.00	[{"num": 10, "spec": "斤", "price": 5, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0004288	0	0		0		2026-03-31 02:34:46.740738	\N
371	CG202603312096	CG202603319923	80	奥特尔奶食品店	牧区纯坊官方品牌	2026-01-27	526.00	0.00	0.00	[{"num": 3, "spec": "2斤装", "price": 32, "unit_id": 0, "goods_id": 838, "goods_sn": "SP0000197", "unit_name": "袋", "goods_name": "奶粉蒙古国", "total_price": 96}, {"num": 4, "spec": "360克", "price": 12, "unit_id": 0, "goods_id": 839, "goods_sn": "SP0000196", "unit_name": "袋", "goods_name": "奶皮子粉", "total_price": 48}, {"num": 2, "spec": "300克", "price": 15, "unit_id": 0, "goods_id": 840, "goods_sn": "SP0000195", "unit_name": "盒", "goods_name": "奶茶粉战粮", "total_price": 30}, {"num": 2, "spec": "400克", "price": 18, "unit_id": 0, "goods_id": 841, "goods_sn": "SP0000194", "unit_name": "袋", "goods_name": "奶茶粉贡格尔", "total_price": 36}, {"num": 2, "spec": "400克", "price": 22, "unit_id": 0, "goods_id": 842, "goods_sn": "SP0000193", "unit_name": "袋", "goods_name": "努德勒沁调和茶", "total_price": 44}, {"num": 2, "spec": "400克", "price": 22, "unit_id": 0, "goods_id": 843, "goods_sn": "SP0000192", "unit_name": "袋", "goods_name": "阿依古丽奶茶专用红茶", "total_price": 44}, {"num": 2, "spec": "400克", "price": 22, "unit_id": 0, "goods_id": 844, "goods_sn": "SP0000191", "unit_name": "盒", "goods_name": "希日嘎拉奶茶专用茶", "total_price": 44}, {"num": 5, "spec": "1一斤", "price": 28, "unit_id": 0, "goods_id": 837, "goods_sn": "SP0000198", "unit_name": "袋", "goods_name": "甜味奶豆腐块儿/大", "total_price": 140}, {"num": 2, "spec": "400克", "price": 22, "unit_id": 0, "goods_id": 844, "goods_sn": "SP0000191", "unit_name": "盒", "goods_name": "希日嘎拉奶茶专用茶", "total_price": 44}]	从saas.mzth.cn导入 原单号:CG0004117	0	0		0		2026-03-31 02:35:01.141757	\N
363	CG202603315671	CG202603313040	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-09	95.00	0.00	0.00	[{"num": 5, "spec": "1", "price": 19, "unit_id": 0, "goods_id": 829, "goods_sn": "SP0000207", "unit_name": "张", "goods_name": "奶豆腐/原味/中/科尔沁", "total_price": 95}]	从saas.mzth.cn导入 原单号:CG0004368	0	0		0		2026-03-31 02:34:40.712927	\N
362	CG202603319839	CG202603317050	98	科尔沁奶食品	1号店员专用	2026-02-09	158.00	0.00	0.00	[{"num": 30, "spec": "1斤", "price": 5.26667, "unit_id": 0, "goods_id": 901, "goods_sn": "SP0000134", "unit_name": "麻袋", "goods_name": "手工白花炒米/散装", "total_price": 158}]	从saas.mzth.cn导入 原单号:CG0004383	0	0		0		2026-03-31 02:34:39.580127	\N
370	CG202603317619	CG202603319302	79	沈阳包装	牧区纯坊官方品牌	2026-01-27	2785.97	0.00	0.00	[{"num": 540, "spec": "1", "price": 5.1592, "unit_id": 0, "goods_id": 836, "goods_sn": "SP0000199", "unit_name": "个", "goods_name": "礼盒/2026", "total_price": 2785.97}]	从saas.mzth.cn导入 原单号:CG0004118	0	0		0		2026-03-31 02:34:54.583029	\N
368	CG202603317843	CG202603312819	86	雷记炒货	牧区纯坊官方品牌	2026-02-01	100.00	0.00	0.00	[{"num": 10, "spec": "散称", "price": 10, "unit_id": 0, "goods_id": 860, "goods_sn": "SP0000175", "unit_name": "散", "goods_name": "普通瓜子", "total_price": 100}]	从saas.mzth.cn导入 原单号:CG0004241	0	0		0		2026-03-31 02:34:50.771648	\N
361	CG202603314546	CG202603317412	98	科尔沁奶食品	1号店员专用	2026-02-10	50.00	0.00	0.00	[{"num": 10, "spec": "斤", "price": 5, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0004384	0	0		0		2026-03-31 02:34:37.911591	\N
360	CG202603315780	CG202603319272	76	乌日汗奶食品店	1号店员专用	2026-02-10	90.00	0.00	0.00	[{"num": 3, "spec": "300ml", "price": 15, "unit_id": 0, "goods_id": 825, "goods_sn": "SP0000211", "unit_name": "盒", "goods_name": "故乡宝酸马奶", "total_price": 45}, {"num": 5, "spec": "500克", "price": 9, "unit_id": 0, "goods_id": 826, "goods_sn": "SP0000210", "unit_name": "盒", "goods_name": "乌日汗酸奶", "total_price": 45}]	从saas.mzth.cn导入 原单号:CG0004387	0	0		0		2026-03-31 02:34:35.783208	\N
373	CG202603312948	CG202603319456	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-27	140.00	0.00	0.00	[{"num": 10, "spec": "半斤", "price": 14, "unit_id": 0, "goods_id": 916, "goods_sn": "SP0000119", "unit_name": "斤", "goods_name": "脆奶条/散装/科尔沁", "total_price": 140}]	从saas.mzth.cn导入 原单号:CG0004088	0	0		0		2026-03-31 02:35:04.38479	\N
377	CG202603313509	CG202603313906	85	糖炮	牧区纯坊官方品牌	2026-01-20	140.00	0.00	0.00	[{"num": 10, "spec": "3根", "price": 14, "unit_id": 0, "goods_id": 851, "goods_sn": "SP0000184", "unit_name": "盒", "goods_name": "晴王糖葫芦", "total_price": 140}]	从saas.mzth.cn导入 原单号:CG0003936	0	0		0		2026-03-31 02:35:10.175969	\N
380	CG202603318926	CG202603312332	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-20	80.00	0.00	0.00	[{"num": 10, "spec": "斤", "price": 8, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 80}]	从saas.mzth.cn导入 原单号:CG0003930	0	0		0		2026-03-31 02:35:15.179674	\N
376	CG202603315006	CG202603313356	93	杂/采购商	牧区纯坊官方品牌	2026-01-20	49.36	0.00	0.00	[{"num": 100, "spec": "1", "price": 0.4936, "unit_id": 0, "goods_id": 850, "goods_sn": "SP0000185", "unit_name": "张", "goods_name": "红糖袋/delicious", "total_price": 49.36}]	从saas.mzth.cn导入 原单号:CG0003944	0	0		0		2026-03-31 02:35:09.152167	\N
379	CG202603312795	CG202603316628	83	扎旗吉十奶制品	牧区纯坊官方品牌	2026-01-20	90.00	0.00	0.00	[{"num": 5, "spec": "散", "price": 18, "unit_id": 0, "goods_id": 855, "goods_sn": "SP0000180", "unit_name": "散", "goods_name": "奶锅巴/扎旗吉十奶制品", "total_price": 90}]	从saas.mzth.cn导入 原单号:CG0003933	0	0		0		2026-03-31 02:35:14.077193	\N
382	CG202603318254	CG202603318909	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-19	147.00	0.00	0.00	[{"num": 3, "spec": "1.2", "price": 33, "unit_id": 0, "goods_id": 856, "goods_sn": "SP0000179", "unit_name": "张", "goods_name": "科尔沁/大奶豆腐", "total_price": 99}, {"num": 1, "spec": "10斤装/麻袋", "price": 48, "unit_id": 0, "goods_id": 923, "goods_sn": "SP0000112", "unit_name": "麻袋", "goods_name": "炒米/散装/硬口", "total_price": 48}]	从saas.mzth.cn导入 原单号:CG0003897	0	0		0		2026-03-31 02:35:18.028039	\N
381	CG202603311119	CG202603312275	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2026-01-19	6364.00	0.00	0.00	[{"num": 130, "spec": "140克", "price": 48.95385, "unit_id": 0, "goods_id": 872, "goods_sn": "SP0000163", "unit_name": "袋", "goods_name": "半成品/黄金纬度牛肉干/那牧尔", "total_price": 6364}]	从saas.mzth.cn导入 原单号:CG0003899	0	0		0		2026-03-31 02:35:16.174208	\N
375	CG202603311425	CG202603317286	106	拼多多/热缩膜	牧区纯坊官方品牌	2026-01-20	140.00	0.00	0.00	[{"num": 2000, "spec": "1", "price": 0.07, "unit_id": 0, "goods_id": 993, "goods_sn": "SP0000041", "unit_name": "张", "goods_name": "冻炒米专用/塑膜袋", "total_price": 140}]	从saas.mzth.cn导入 原单号:CG0003945	0	0		0		2026-03-31 02:35:07.9499	\N
386	CG202603317814	CG202603319425	85	糖炮	牧区纯坊官方品牌	2026-01-16	240.00	0.00	0.00	[{"num": 40, "spec": "3棵", "price": 6, "unit_id": 0, "goods_id": 858, "goods_sn": "SP0000177", "unit_name": "盒", "goods_name": "糖葫芦", "total_price": 240}]	从saas.mzth.cn导入 原单号:CG0003839	0	0		0		2026-03-31 02:35:22.933175	\N
385	CG202603311710	CG202603315339	113	永巨茶业	牧区纯坊官方品牌	2026-01-16	3310.00	0.00	0.00	[{"num": 10, "spec": "1件2000包/300元/1件", "price": 331, "unit_id": 0, "goods_id": 1011, "goods_sn": "SP0000023", "unit_name": "件", "goods_name": "茶包", "total_price": 3310}]	从saas.mzth.cn导入 原单号:CG0003840	0	0		0		2026-03-31 02:35:21.62463	\N
384	CG202603314014	CG202603316893	84	兴安盟杭盖奶制品厂	牧区纯坊官方品牌	2026-01-17	190.00	0.00	0.00	[{"num": 10, "spec": "1", "price": 19, "unit_id": 0, "goods_id": 857, "goods_sn": "SP0000178", "unit_name": "张", "goods_name": "厚奶皮", "total_price": 190}]	从saas.mzth.cn导入 原单号:CG0003860	0	0		0		2026-03-31 02:35:20.621118	\N
378	CG202603319171	CG202603313877	82	阿齐图/巴林右旗	牧区纯坊官方品牌	2026-01-20	1470.00	0.00	0.00	[{"num": 5, "spec": "孜然", "price": 98, "unit_id": 0, "goods_id": 852, "goods_sn": "SP0000183", "unit_name": "斤", "goods_name": "牛肉干/散/孜然", "total_price": 490}, {"num": 5, "spec": "香辣", "price": 98, "unit_id": 0, "goods_id": 853, "goods_sn": "SP0000182", "unit_name": "斤", "goods_name": "牛肉干/散/香辣", "total_price": 490}, {"num": 5, "spec": "原味", "price": 98, "unit_id": 0, "goods_id": 854, "goods_sn": "SP0000181", "unit_name": "斤", "goods_name": "牛肉干/散/原味", "total_price": 490}]	从saas.mzth.cn导入 原单号:CG0003935	0	0		0		2026-03-31 02:35:13.067382	\N
389	CG202603319582	CG202603318785	86	雷记炒货	牧区纯坊官方品牌	2026-01-11	200.00	0.00	0.00	[{"num": 5, "spec": "散称", "price": 10, "unit_id": 0, "goods_id": 860, "goods_sn": "SP0000175", "unit_name": "散", "goods_name": "普通瓜子", "total_price": 50}, {"num": 10, "spec": "散称", "price": 15, "unit_id": 0, "goods_id": 861, "goods_sn": "SP0000174", "unit_name": "散", "goods_name": "五香瓜子", "total_price": 150}]	从saas.mzth.cn导入 原单号:CG0003706	0	0		0		2026-03-31 02:35:28.575709	\N
388	CG202603313858	CG202603316686	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-11	48.00	0.00	0.00	[{"num": 10, "spec": "500g", "price": 4.8, "unit_id": 0, "goods_id": 931, "goods_sn": "SP0000104", "unit_name": "袋", "goods_name": "炒米粉/aag", "total_price": 48}]	从saas.mzth.cn导入 原单号:CG0003707	0	0		0		2026-03-31 02:35:26.170622	\N
393	CG202603313876	CG202603311601	108	山东锦食食品	牧区纯坊官方品牌	2026-01-09	687.00	0.00	0.00	[{"num": 10, "spec": "2g", "price": 68.7, "unit_id": 0, "goods_id": 997, "goods_sn": "SP0000037", "unit_name": "件", "goods_name": "茶专用/盐包", "total_price": 687}]	从saas.mzth.cn导入 原单号:CG0003666	0	0		0		2026-03-31 02:35:32.879494	\N
398	CG202603311038	CG202603316779	97	纯净奶食品	牧区纯坊官方品牌	2026-01-03	60.00	0.00	0.00	[{"num": 10, "spec": "400ke", "price": 6, "unit_id": 0, "goods_id": 866, "goods_sn": "SP0000169", "unit_name": "瓶", "goods_name": "酸奶/纯净", "total_price": 60}]	从saas.mzth.cn导入 原单号:CG0003504	0	0		0		2026-03-31 02:35:41.304442	\N
397	CG202603315470	CG202603314775	88	茁硕乐/牛肉干	牧区纯坊官方品牌	2026-01-03	980.00	0.00	0.00	[{"num": 20, "spec": "250克", "price": 49, "unit_id": 0, "goods_id": 865, "goods_sn": "SP0000170", "unit_name": "袋", "goods_name": "牛肉干/和希格图", "total_price": 980}]	从saas.mzth.cn导入 原单号:CG0003505	0	0		0		2026-03-31 02:35:40.198346	\N
392	CG202603319904	CG202603319485	105	翁牛特旗奶果子	牧区纯坊官方品牌	2026-01-09	3653.00	0.00	0.00	[{"num": 119, "spec": "平均一块儿", "price": 30.69748, "unit_id": 0, "goods_id": 991, "goods_sn": "SP0000043", "unit_name": "斤", "goods_name": "奶果子/散装", "total_price": 3653}]	从saas.mzth.cn导入 原单号:CG0003667	0	0		0		2026-03-31 02:35:31.868741	\N
387	CG202603317919	CG202603315149	90	阿润查干	牧区纯坊官方品牌	2026-01-16	680.00	0.00	0.00	[{"num": 10, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 879, "goods_sn": "SP0000156", "unit_name": "盒", "goods_name": "干肉奶茶", "total_price": 55}, {"num": 25, "spec": "奶油炒米/ 黑芝麻/ 乌日莫糖/ 酸奶炒米/ 奶油花生", "price": 25, "unit_id": 0, "goods_id": 859, "goods_sn": "SP0000176", "unit_name": "4030", "goods_name": "糖/阿润", "total_price": 625}]	从saas.mzth.cn导入 原单号:CG0003838	0	0		0		2026-03-31 02:35:24.409681	\N
396	CG202603312353	CG202603317071	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-06	220.00	0.00	0.00	[{"num": 10, "spec": "斤/两盒", "price": 22, "unit_id": 0, "goods_id": 981, "goods_sn": "SP0000053", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 220}]	从saas.mzth.cn导入 原单号:CG0003544	0	0		0		2026-03-31 02:35:39.114575	\N
395	CG202603316269	CG202603313821	117	巴音珠萨朗	牧区纯坊官方品牌	2026-01-06	854.00	0.00	0.00	[{"num": 53.4, "spec": "250克/一袋", "price": 15.99251, "unit_id": 0, "goods_id": 1014, "goods_sn": "SP0000020", "unit_name": "斤", "goods_name": "散装/甜味奶条", "total_price": 854}]	从saas.mzth.cn导入 原单号:CG0003546	0	0		0		2026-03-31 02:35:37.577394	\N
391	CG202603315468	CG202603319912	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-11	50.00	0.00	0.00	[{"num": 10, "spec": "斤", "price": 5, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0003704	0	0		0		2026-03-31 02:35:30.559859	\N
390	CG202603312889	CG202603318310	96	浙江金矿包装	牧区纯坊官方品牌	2026-01-11	611.76	0.00	0.00	[{"num": 720, "spec": "7.4X7.4X7.8 奶豆腐/冻炒米通用", "price": 0.84967, "unit_id": 0, "goods_id": 963, "goods_sn": "SP0000071", "unit_name": "盒", "goods_name": "小/方形/亚克力盒/", "total_price": 611.76}]	从saas.mzth.cn导入 原单号:CG0003705	0	0		0		2026-03-31 02:35:29.56263	\N
394	CG202603319112	CG202603316221	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-07	713.00	0.00	0.00	[{"num": 1, "spec": "10斤装/麻袋", "price": 48, "unit_id": 0, "goods_id": 923, "goods_sn": "SP0000112", "unit_name": "麻袋", "goods_name": "炒米/散装/硬口", "total_price": 48}, {"num": 10, "spec": "斤/两盒", "price": 22, "unit_id": 0, "goods_id": 981, "goods_sn": "SP0000053", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 220}, {"num": 3, "spec": "1斤", "price": 85, "unit_id": 0, "goods_id": 908, "goods_sn": "SP0000127", "unit_name": "袋", "goods_name": "哈斯乌拉牛肉干500g原味", "total_price": 255}, {"num": 2, "spec": "1斤", "price": 95, "unit_id": 0, "goods_id": 907, "goods_sn": "SP0000128", "unit_name": "袋", "goods_name": "风干牛肉500g大片", "total_price": 190}]	从saas.mzth.cn导入 原单号:CG0003599	0	0		0		2026-03-31 02:35:35.884014	\N
406	CG202603316305	CG202603318256	121	盛大印刷	牧区纯坊官方品牌	2025-12-25	43.20	0.00	0.00	[{"num": 500, "spec": "1", "price": 0.0432, "unit_id": 0, "goods_id": 983, "goods_sn": "SP0000051", "unit_name": "张", "goods_name": "甜味/标签/不干胶/传统奶豆腐", "total_price": 21.6}, {"num": 500, "spec": "1", "price": 0.0432, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 21.6}]	从saas.mzth.cn导入 原单号:CG0003290	0	0		0		2026-03-31 02:36:03.571776	\N
405	CG202603314661	CG202603311283	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-28	75.00	0.00	0.00	[{"num": 6, "spec": "1一斤装", "price": 12.5, "unit_id": 0, "goods_id": 878, "goods_sn": "SP0000157", "unit_name": "盒", "goods_name": "羊奶粉/1斤", "total_price": 75}]	从saas.mzth.cn导入 原单号:CG0003393	0	0		0		2026-03-31 02:35:59.550361	\N
404	CG202603319789	CG202603315981	117	巴音珠萨朗	牧区纯坊官方品牌	2025-12-28	310.20	0.00	0.00	[{"num": 18.8, "spec": "250克/一袋", "price": 16.5, "unit_id": 0, "goods_id": 1014, "goods_sn": "SP0000020", "unit_name": "斤", "goods_name": "散装/甜味奶条", "total_price": 310.2}]	从saas.mzth.cn导入 原单号:CG0003398	0	0		0		2026-03-31 02:35:58.223866	\N
403	CG202603315199	CG202603311090	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-28	75.00	0.00	0.00	[{"num": 5, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 75}]	从saas.mzth.cn导入 原单号:CG0003418	0	0		0		2026-03-31 02:35:55.128198	\N
401	CG202603318172	CG202603317715	92	奥都奶食品	牧区纯坊官方品牌	2025-12-31	315.00	0.00	0.00	[{"num": 5, "spec": "半斤装", "price": 11, "unit_id": 0, "goods_id": 918, "goods_sn": "SP0000117", "unit_name": "瓶", "goods_name": "黄油/半斤", "total_price": 55}, {"num": 5, "spec": "400克", "price": 20, "unit_id": 0, "goods_id": 919, "goods_sn": "SP0000116", "unit_name": "瓶", "goods_name": "黄油/斤", "total_price": 100}, {"num": 10, "spec": "1", "price": 16, "unit_id": 0, "goods_id": 885, "goods_sn": "SP0000150", "unit_name": "斤", "goods_name": "冻炒米/散装", "total_price": 160}]	从saas.mzth.cn导入 原单号:CG0004240	0	0		0		2026-03-31 02:35:48.628183	\N
408	CG202603318561	CG202603319644	121	盛大印刷	牧区纯坊官方品牌	2025-12-25	47.80	0.00	0.00	[{"num": 500, "spec": "1", "price": 0.0956, "unit_id": 0, "goods_id": 1024, "goods_sn": "SP0000010", "unit_name": "张", "goods_name": "标签/不干胶/奶条/甜味", "total_price": 47.8}]	从saas.mzth.cn导入 原单号:CG0003288	0	0		0		2026-03-31 02:36:06.746362	\N
407	CG202603311750	CG202603319749	121	盛大印刷	牧区纯坊官方品牌	2025-12-25	33.50	0.00	0.00	[{"num": 500, "spec": "1张", "price": 0.067, "unit_id": 0, "goods_id": 898, "goods_sn": "SP0000137", "unit_name": "张", "goods_name": "透专标签/奶皮千层", "total_price": 33.5}]	从saas.mzth.cn导入 原单号:CG0003289	0	0		0		2026-03-31 02:36:04.757539	\N
414	CG202603315281	CG202603319956	92	奥都奶食品	牧区纯坊官方品牌	2025-12-19	352.00	0.00	0.00	[{"num": 13.25, "spec": "1", "price": 16, "unit_id": 0, "goods_id": 885, "goods_sn": "SP0000150", "unit_name": "斤", "goods_name": "冻炒米/散装", "total_price": 212}, {"num": 5, "spec": "1", "price": 12, "unit_id": 0, "goods_id": 884, "goods_sn": "SP0000151", "unit_name": "个", "goods_name": "实惠/奶豆腐", "total_price": 60}, {"num": 10, "spec": "300克", "price": 8, "unit_id": 0, "goods_id": 924, "goods_sn": "SP0000111", "unit_name": "袋", "goods_name": "冻炒米/袋装", "total_price": 80}]	从saas.mzth.cn导入 原单号:CG0003106	0	0		0		2026-03-31 02:36:24.668403	\N
413	CG202603319917	CG202603319344	97	纯净奶食品	牧区纯坊官方品牌	2025-12-21	325.00	0.00	0.00	[{"num": 25, "spec": "180克", "price": 13, "unit_id": 0, "goods_id": 945, "goods_sn": "SP0000090", "unit_name": "盒", "goods_name": "半成品/透明/奶皮卷", "total_price": 325}]	从saas.mzth.cn导入 原单号:CG0003139	0	0		0		2026-03-31 02:36:21.817648	\N
412	CG202603319237	CG202603311730	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-24	150.00	0.00	0.00	[{"num": 10, "spec": "1盒", "price": 15, "unit_id": 0, "goods_id": 889, "goods_sn": "SP0000146", "unit_name": "盒", "goods_name": "奶皮卷/科尔沁", "total_price": 150}]	从saas.mzth.cn导入 原单号:CG0003217	0	0		0		2026-03-31 02:36:18.995522	\N
411	CG202603318798	CG202603317218	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-25	140.00	0.00	0.00	[{"num": 9, "spec": "1", "price": 10, "unit_id": 0, "goods_id": 884, "goods_sn": "SP0000151", "unit_name": "个", "goods_name": "实惠/奶豆腐", "total_price": 90}, {"num": 10, "spec": "斤", "price": 5, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0003253	0	0		0		2026-03-31 02:36:16.312712	\N
419	CG202603314778	CG202603311981	117	巴音珠萨朗	牧区纯坊官方品牌	2025-12-16	184.00	0.00	0.00	[{"num": 23, "spec": "250克/一袋", "price": 8, "unit_id": 0, "goods_id": 1014, "goods_sn": "SP0000020", "unit_name": "斤", "goods_name": "散装/甜味奶条", "total_price": 184}]	从saas.mzth.cn导入 原单号:CG0003056	0	0		0		2026-03-31 02:36:33.841424	\N
418	CG202603312913	CG202603317380	116	恩赫奶制品厂	牧区纯坊官方品牌	2025-12-16	216.00	0.00	0.00	[{"num": 12, "spec": "250克/一袋", "price": 18, "unit_id": 0, "goods_id": 1015, "goods_sn": "SP0000019", "unit_name": "斤", "goods_name": "散装/原味奶条", "total_price": 216}]	从saas.mzth.cn导入 原单号:CG0003057	0	0		0		2026-03-31 02:36:32.851667	\N
417	CG202603316981	CG202603319778	93	杂/采购商	牧区纯坊官方品牌	2025-12-17	144.00	0.00	0.00	[{"num": 12, "spec": "1", "price": 12, "unit_id": 0, "goods_id": 890, "goods_sn": "SP0000145", "unit_name": "斤", "goods_name": "红枣", "total_price": 144}]	从saas.mzth.cn导入 原单号:CG0003074	0	0		0		2026-03-31 02:36:31.786854	\N
416	CG202603319402	CG202603319795	97	纯净奶食品	牧区纯坊官方品牌	2025-12-17	971.50	0.00	0.00	[{"num": 17, "spec": "150克", "price": 14.5, "unit_id": 0, "goods_id": 973, "goods_sn": "SP0000061", "unit_name": "袋", "goods_name": "精品/奶豆腐块儿/甜味/", "total_price": 246.5}, {"num": 50, "spec": "150克", "price": 14.5, "unit_id": 0, "goods_id": 986, "goods_sn": "SP0000048", "unit_name": "袋", "goods_name": "精品/奶豆腐块儿/原味", "total_price": 725}]	从saas.mzth.cn导入 原单号:CG0003075	0	0		0		2026-03-31 02:36:30.748845	\N
421	CG202603318036	CG202603319515	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-14	235.00	0.00	0.00	[{"num": 5, "spec": "1斤散称", "price": 22, "unit_id": 0, "goods_id": 902, "goods_sn": "SP0000133", "unit_name": "斤", "goods_name": "乌日莫糖/散装", "total_price": 110}, {"num": 5, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 75}, {"num": 5, "spec": "1斤散称", "price": 10, "unit_id": 0, "goods_id": 922, "goods_sn": "SP0000113", "unit_name": "斤", "goods_name": "酸奶炒米糖/散装", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0003015	0	0		0		2026-03-31 02:36:39.998846	\N
424	CG202603315371	CG202603316862	97	纯净奶食品	牧区纯坊官方品牌	2025-12-12	272.00	0.00	0.00	[{"num": 6, "spec": "1斤装", "price": 22, "unit_id": 0, "goods_id": 899, "goods_sn": "SP0000136", "unit_name": "瓶", "goods_name": "纯净/黄油/斤", "total_price": 132}, {"num": 10, "spec": "180克", "price": 14, "unit_id": 0, "goods_id": 945, "goods_sn": "SP0000090", "unit_name": "盒", "goods_name": "半成品/透明/奶皮卷", "total_price": 140}]	从saas.mzth.cn导入 原单号:CG0002992	0	0		0		2026-03-31 02:36:45.05358	\N
428	CG202603316651	CG202603317638	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2025-12-10	550.00	0.00	0.00	[{"num": 100, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_sn": "SP0000021", "unit_name": "盒", "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 550}]	从saas.mzth.cn导入 原单号:CG0002953	0	0		0		2026-03-31 02:36:55.455246	\N
426	CG202603313799	CG202603312275	112	广州维记	牧区纯坊官方品牌	2025-12-10	3380.00	0.00	0.00	[{"num": 20, "spec": "400/箱/0.423/球", "price": 169, "unit_id": 0, "goods_id": 1010, "goods_sn": "SP0000024", "unit_name": "件", "goods_name": "奶油球", "total_price": 3380}]	从saas.mzth.cn导入 原单号:CG0002956	0	0		0		2026-03-31 02:36:48.291876	\N
425	CG202603318375	CG202603315874	93	杂/采购商	牧区纯坊官方品牌	2025-12-10	21.00	0.00	0.00	[{"num": 6, "spec": "400克", "price": 3.5, "unit_id": 0, "goods_id": 929, "goods_sn": "SP0000106", "unit_name": "袋", "goods_name": "白砂糖", "total_price": 21}]	从saas.mzth.cn导入 原单号:CG0002994	0	0		0		2026-03-31 02:36:46.036874	\N
423	CG202603316227	CG202603314715	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2025-12-12	550.00	0.00	0.00	[{"num": 100, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_sn": "SP0000021", "unit_name": "盒", "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 550}]	从saas.mzth.cn导入 原单号:CG0002993	0	0		0		2026-03-31 02:36:42.466356	\N
422	CG202603317045	CG202603315869	92	奥都奶食品	牧区纯坊官方品牌	2025-12-13	128.00	0.00	0.00	[{"num": 10, "spec": "斤", "price": 8, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 80}, {"num": 4, "spec": "斤", "price": 12, "unit_id": 0, "goods_id": 917, "goods_sn": "SP0000118", "unit_name": "斤", "goods_name": "机器乌日末液体", "total_price": 48}]	从saas.mzth.cn导入 原单号:CG0003007	0	0		0		2026-03-31 02:36:41.465218	\N
433	CG202603316236	CG202603316793	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-09	48.00	0.00	0.00	[{"num": 1, "spec": "10斤装/麻袋", "price": 48, "unit_id": 0, "goods_id": 923, "goods_sn": "SP0000112", "unit_name": "麻袋", "goods_name": "炒米/散装/硬口", "total_price": 48}]	从saas.mzth.cn导入 原单号:CG0002908	0	0		0		2026-03-31 02:37:13.014864	\N
432	CG202603316781	CG202603318804	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-09	25.00	0.00	0.00	[{"num": 1, "spec": "1斤散称", "price": 10, "unit_id": 0, "goods_id": 922, "goods_sn": "SP0000113", "unit_name": "麻袋", "goods_name": "酸奶炒米糖/散装", "total_price": 10}, {"num": 1, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "麻袋", "goods_name": "嚼口脆炒米糖/散装", "total_price": 15}]	从saas.mzth.cn导入 原单号:CG0002913	0	0		0		2026-03-31 02:37:12.05827	\N
431	CG202603317747	CG202603314528	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-09	751.00	0.00	0.00	[{"num": 2, "spec": "1斤", "price": 95, "unit_id": 0, "goods_id": 907, "goods_sn": "SP0000128", "unit_name": "袋", "goods_name": "风干牛肉500g大片", "total_price": 190}, {"num": 2, "spec": "1斤", "price": 83, "unit_id": 0, "goods_id": 908, "goods_sn": "SP0000127", "unit_name": "袋", "goods_name": "哈斯乌拉牛肉干500g原味", "total_price": 166}, {"num": 2, "spec": "450g", "price": 7, "unit_id": 0, "goods_id": 909, "goods_sn": "SP0000126", "unit_name": "袋", "goods_name": "蓝旗绿乳糖惠虹糖", "total_price": 14}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 910, "goods_sn": "SP0000125", "unit_name": "袋", "goods_name": "蓝旗绿乳糖奶香酥", "total_price": 8}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 911, "goods_sn": "SP0000124", "unit_name": "袋", "goods_name": "蓝旗绿乳糖果仁酥", "total_price": 8}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 912, "goods_sn": "SP0000123", "unit_name": "袋", "goods_name": "蓝旗绿乳糖水果", "total_price": 8}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 913, "goods_sn": "SP0000122", "unit_name": "袋", "goods_name": "蓝旗绿乳糖黄油球", "total_price": 8}, {"num": 2, "spec": "270", "price": 4, "unit_id": 0, "goods_id": 914, "goods_sn": "SP0000121", "unit_name": "袋", "goods_name": "蓝旗绿乳糖炼乳", "total_price": 8}, {"num": 1, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 15}, {"num": 1, "spec": "1斤散称", "price": 10, "unit_id": 0, "goods_id": 922, "goods_sn": "SP0000113", "unit_name": "斤", "goods_name": "酸奶炒米糖/散装", "total_price": 10}, {"num": 4, "spec": "250克", "price": 8, "unit_id": 0, "goods_id": 915, "goods_sn": "SP0000120", "unit_name": "盒", "goods_name": "黄油渣/盒", "total_price": 32}, {"num": 10, "spec": "半斤", "price": 14, "unit_id": 0, "goods_id": 916, "goods_sn": "SP0000119", "unit_name": "斤", "goods_name": "脆奶条/散装/科尔沁", "total_price": 140}, {"num": 2, "spec": "500g", "price": 17, "unit_id": 0, "goods_id": 905, "goods_sn": "SP0000130", "unit_name": "袋", "goods_name": "真空奶豆腐砖/甜味", "total_price": 34}, {"num": 2, "spec": "500g", "price": 17, "unit_id": 0, "goods_id": 906, "goods_sn": "SP0000129", "unit_name": "袋", "goods_name": "真空奶豆腐砖/原味", "total_price": 34}, {"num": 2, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 903, "goods_sn": "SP0000132", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/甜味", "total_price": 38}, {"num": 2, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 904, "goods_sn": "SP0000131", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/原味", "total_price": 38}]	从saas.mzth.cn导入 原单号:CG0002914	0	0		0		2026-03-31 02:37:10.428197	\N
260	CG202603301141	CG202603303982	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-17	555.00	0.00	0.00	[{"num": 20, "spec": "半斤", "price": 14, "unit_id": 0, "goods_id": 916, "goods_sn": "SP0000119", "unit_name": "斤", "goods_name": "脆奶条/散装/科尔沁", "total_price": 280}, {"num": 7, "spec": "1盒", "price": 15, "unit_id": 0, "goods_id": 889, "goods_sn": "SP0000146", "unit_name": "盒", "goods_name": "奶皮卷/科尔沁", "total_price": 105}, {"num": 2, "spec": "1", "price": 7, "unit_id": 0, "goods_id": 886, "goods_sn": "SP0000149", "unit_name": "盒", "goods_name": "冻炒米/科尔沁", "total_price": 14}, {"num": 4, "spec": "320克", "price": 25, "unit_id": 0, "goods_id": 887, "goods_sn": "SP0000148", "unit_name": "盒", "goods_name": "羊乳奶粉/奶茶专用", "total_price": 100}, {"num": 4, "spec": "320克", "price": 14, "unit_id": 0, "goods_id": 888, "goods_sn": "SP0000147", "unit_name": "盒", "goods_name": "河套奶粉", "total_price": 56}]	从saas.mzth.cn导入 原单号:CG0003078	0	0		0		2026-03-30 17:37:46.921741	\N
441	CG202603314585	CG202603315058	121	盛大印刷	牧区纯坊官方品牌	2025-12-04	743.93	0.00	0.00	[{"num": 20000, "spec": "1", "price": 0.0265, "unit_id": 0, "goods_id": 979, "goods_sn": "SP0000055", "unit_name": "张", "goods_name": "新茶包/纸", "total_price": 530}, {"num": 500, "spec": "1", "price": 0.0682, "unit_id": 0, "goods_id": 1020, "goods_sn": "SP0000014", "unit_name": "张", "goods_name": "标签/不干胶/奶果子", "total_price": 34.1}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 950, "goods_sn": "SP0000085", "unit_name": "张", "goods_name": "透专标签/奶皮卷", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 951, "goods_sn": "SP0000084", "unit_name": "张", "goods_name": "透专标签/冻炒米", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 952, "goods_sn": "SP0000083", "unit_name": "张", "goods_name": "透专标签/奶酪/原味", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 953, "goods_sn": "SP0000082", "unit_name": "张", "goods_name": "透专标签/奶酪/甜味", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 954, "goods_sn": "SP0000081", "unit_name": "张", "goods_name": "透专标签/乳清奶条/甜味", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 955, "goods_sn": "SP0000080", "unit_name": "张", "goods_name": "透专标签/乳清奶条/原味", "total_price": 25.69}, {"num": 500, "spec": "1张", "price": 0.05137, "unit_id": 0, "goods_id": 956, "goods_sn": "SP0000079", "unit_name": "张", "goods_name": "透专标签/鲜奶皮", "total_price": 25.69}]	从saas.mzth.cn导入 原单号:CG0002855	0	0		0		2026-03-31 02:37:33.943652	\N
447	CG202603318201	CG202603319001	118	淘宝/江苏永发玻璃制品厂	牧区纯坊官方品牌	2025-12-01	648.00	0.00	0.00	[{"num": 240, "spec": "100ML", "price": 1.8, "unit_id": 0, "goods_id": 1016, "goods_sn": "SP0000018", "unit_name": "瓶", "goods_name": "专瓶/黄油", "total_price": 432}, {"num": 120, "spec": "120mL", "price": 1.8, "unit_id": 0, "goods_id": 862, "goods_sn": "SP0000173", "unit_name": "瓶", "goods_name": "专瓶/黄油渣", "total_price": 216}]	从saas.mzth.cn导入 原单号:CG0002797	0	0		0		2026-03-31 02:37:50.731197	\N
446	CG202603318017	CG202603319667	120	淘宝紫辰包装	牧区纯坊官方品牌	2025-12-01	70.40	0.00	0.00	[{"num": 500, "spec": "1", "price": 0.1408, "unit_id": 0, "goods_id": 1027, "goods_sn": "SP0000007", "unit_name": "张", "goods_name": "真空袋", "total_price": 70.4}]	从saas.mzth.cn导入 原单号:CG0002801	0	0		0		2026-03-31 02:37:49.071899	\N
438	CG202603317215	CG202603312757	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-05	166.00	0.00	0.00	[{"num": 5, "spec": "500克", "price": 12, "unit_id": 0, "goods_id": 930, "goods_sn": "SP0000105", "unit_name": "袋", "goods_name": "加沙奶豆腐", "total_price": 60}, {"num": 10, "spec": "500g", "price": 4.8, "unit_id": 0, "goods_id": 931, "goods_sn": "SP0000104", "unit_name": "袋", "goods_name": "炒米粉/aag", "total_price": 48}, {"num": 10, "spec": "500克", "price": 5.8, "unit_id": 0, "goods_id": 932, "goods_sn": "SP0000103", "unit_name": "袋", "goods_name": "炒米海丰", "total_price": 58}]	从saas.mzth.cn导入 原单号:CG0002863	0	0		0		2026-03-31 02:37:26.587635	\N
434	CG202603319564	CG202603319655	111	优如包装	牧区纯坊官方品牌	2025-12-07	4400.01	0.00	0.00	[{"num": 3000, "spec": "140克", "price": 1.46667, "unit_id": 0, "goods_id": 873, "goods_sn": "SP0000162", "unit_name": "袋", "goods_name": "专袋/牛肉干包装", "total_price": 4400.01}]	从saas.mzth.cn导入 原单号:CG0003407	0	0		0		2026-03-31 02:37:14.037632	\N
448	CG202603319137	CG202603318178	99	淘宝/杂	牧区纯坊官方品牌	2025-12-01	925.00	0.00	0.00	[{"num": 5000, "spec": "1", "price": 0.185, "unit_id": 0, "goods_id": 982, "goods_sn": "SP0000052", "unit_name": "个", "goods_name": "塑料手提袋", "total_price": 925}]	从saas.mzth.cn导入 原单号:CG0002794	0	0		0		2026-03-31 02:37:52.49884	\N
444	CG202603315629	CG202603312047	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-04	154.00	0.00	0.00	[{"num": 7, "spec": "斤/两盒", "price": 22, "unit_id": 0, "goods_id": 981, "goods_sn": "SP0000053", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 154}]	从saas.mzth.cn导入 原单号:CG0002847	0	0		0		2026-03-31 02:37:43.055863	\N
453	CG202603312758	CG202603315329	101	拼多多/随机店采购	牧区纯坊官方品牌	2025-11-16	38.00	0.00	0.00	[{"num": 1, "spec": "1", "price": 38, "unit_id": 0, "goods_id": 1002, "goods_sn": "SP0000032", "unit_name": "台", "goods_name": "封口机/真空", "total_price": 38}]	从saas.mzth.cn导入 原单号:CG0002607	0	0		0		2026-03-31 02:38:01.007514	\N
457	CG202603313230	CG202603314365	112	广州维记	牧区纯坊官方品牌	2025-11-07	1817.00	0.00	0.00	[{"num": 10, "spec": "400/箱/0.423/球", "price": 181.7, "unit_id": 0, "goods_id": 1010, "goods_sn": "SP0000024", "unit_name": "件", "goods_name": "奶油球", "total_price": 1817}]	从saas.mzth.cn导入 原单号:CG0002603	0	0		0		2026-03-31 02:38:08.488914	\N
454	CG202603318383	CG202603315747	106	拼多多/热缩膜	牧区纯坊官方品牌	2025-11-16	245.49	0.00	0.00	[{"num": 2600, "spec": "0", "price": 0.09442, "unit_id": 0, "goods_id": 995, "goods_sn": "SP0000039", "unit_name": "袋", "goods_name": "茶专用/热缩膜", "total_price": 245.49}]	从saas.mzth.cn导入 原单号:CG0002606	0	0		0		2026-03-31 02:38:02.048293	\N
456	CG202603311066	CG202603314495	117	巴音珠萨朗	牧区纯坊官方品牌	2025-11-16	357.00	0.00	0.00	[{"num": 21, "spec": "250克/一袋", "price": 17, "unit_id": 0, "goods_id": 1014, "goods_sn": "SP0000020", "unit_name": "斤", "goods_name": "散装/甜味奶条", "total_price": 357}]	从saas.mzth.cn导入 原单号:CG0002604	0	0		0		2026-03-31 02:38:05.662131	\N
461	CG202603316946	CG202603312995	114	阿旗北方	牧区纯坊官方品牌	2025-10-31	16.50	0.00	0.00	[{"num": 3, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_sn": "SP0000021", "unit_name": "盒", "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 16.5}]	从saas.mzth.cn导入 原单号:CG0002415	0	0		0		2026-03-31 02:38:16.138238	\N
443	CG202603318249	CG202603317797	97	纯净奶食品	牧区纯坊官方品牌	2025-12-04	772.00	0.00	0.00	[{"num": 20, "spec": "150克", "price": 14.5, "unit_id": 0, "goods_id": 973, "goods_sn": "SP0000061", "unit_name": "袋", "goods_name": "精品/奶豆腐块儿/甜味/", "total_price": 290}, {"num": 20, "spec": "150克", "price": 14.5, "unit_id": 0, "goods_id": 986, "goods_sn": "SP0000048", "unit_name": "袋", "goods_name": "精品/奶豆腐块儿/原味", "total_price": 290}, {"num": 32, "spec": "1", "price": 6, "unit_id": 0, "goods_id": 974, "goods_sn": "SP0000060", "unit_name": "瓶", "goods_name": "纯净黄油/瓶装好的", "total_price": 192}]	从saas.mzth.cn导入 原单号:CG0002852	0	0		0		2026-03-31 02:37:41.726816	\N
458	CG202603313108	CG202603311021	108	山东锦食食品	牧区纯坊官方品牌	2025-11-01	242.08	0.00	0.00	[{"num": 3560, "spec": "2g", "price": 0.068, "unit_id": 0, "goods_id": 997, "goods_sn": "SP0000037", "unit_name": "小包", "goods_name": "茶专用/盐包", "total_price": 242.08}]	从saas.mzth.cn导入 原单号:CG0002475	0	0		0		2026-03-31 02:38:09.462406	\N
462	CG202603317037	CG202603314251	104	锡盟艾润萨利SC	牧区纯坊官方品牌	2025-10-26	470.00	0.00	0.00	[{"num": 14, "spec": "不定具体产品", "price": 33.57143, "unit_id": 0, "goods_id": 987, "goods_sn": "SP0000047", "unit_name": "斤", "goods_name": "采购样品专用/乳制品", "total_price": 470}]	从saas.mzth.cn导入 原单号:CG0002220	0	0		0		2026-03-31 02:38:17.10163	\N
460	CG202603319388	CG202603312155	108	山东锦食食品	牧区纯坊官方品牌	2025-11-01	550.00	0.00	0.00	[{"num": 8, "spec": "2g", "price": 68.75, "unit_id": 0, "goods_id": 997, "goods_sn": "SP0000037", "unit_name": "件", "goods_name": "茶专用/盐包", "total_price": 550}]	从saas.mzth.cn导入 原单号:CG0002418	0	0		0		2026-03-31 02:38:15.154954	\N
452	CG202603315962	CG202603318832	101	拼多多/随机店采购	牧区纯坊官方品牌	2025-11-16	2800.00	0.00	0.00	[{"num": 1, "spec": "1", "price": 2800, "unit_id": 0, "goods_id": 1001, "goods_sn": "SP0000033", "unit_name": "台", "goods_name": "冷冻柜/冰箱", "total_price": 2800}]	从saas.mzth.cn导入 原单号:CG0002608	0	0		0		2026-03-31 02:37:59.993348	\N
455	CG202603317098	CG202603317743	107	拼多多/木勺	牧区纯坊官方品牌	2025-11-16	159.90	0.00	0.00	[{"num": 10, "spec": "袋100个/平均价0.1599", "price": 15.99, "unit_id": 0, "goods_id": 1000, "goods_sn": "SP0000034", "unit_name": "捆", "goods_name": "木勺", "total_price": 159.9}]	从saas.mzth.cn导入 原单号:CG0002605	0	0		0		2026-03-31 02:38:04.445773	\N
467	CG202603314185	CG202603312210	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2025-10-12	165.00	0.00	0.00	[{"num": 30, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_sn": "SP0000021", "unit_name": "盒", "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 165}]	从saas.mzth.cn导入 原单号:CG0002023	0	0		0		2026-03-31 02:38:23.450986	\N
463	CG202603315309	CG202603315155	112	广州维记	牧区纯坊官方品牌	2025-10-26	1820.00	0.00	0.00	[{"num": 10, "spec": "400/箱/0.423/球", "price": 182, "unit_id": 0, "goods_id": 1010, "goods_sn": "SP0000024", "unit_name": "件", "goods_name": "奶油球", "total_price": 1820}]	从saas.mzth.cn导入 原单号:CG0002219	0	0		0		2026-03-31 02:38:19.050783	\N
472	CG202603319414	CG202603315163	113	永巨茶业	牧区纯坊官方品牌	2025-10-06	2825.04	0.00	0.00	[{"num": 8, "spec": "1件2000包/300元/1件", "price": 353.13, "unit_id": 0, "goods_id": 1011, "goods_sn": "SP0000023", "unit_name": "件", "goods_name": "茶包", "total_price": 2825.04}]	从saas.mzth.cn导入 原单号:CG0002026	0	0		0		2026-03-31 02:38:31.932898	\N
471	CG202603315174	CG202603318958	112	广州维记	牧区纯坊官方品牌	2025-10-09	1455.00	0.00	0.00	[{"num": 8, "spec": "400/箱/0.423/球", "price": 181.875, "unit_id": 0, "goods_id": 1010, "goods_sn": "SP0000024", "unit_name": "件", "goods_name": "奶油球", "total_price": 1455}]	从saas.mzth.cn导入 原单号:CG0002027	0	0		0		2026-03-31 02:38:30.93544	\N
479	CG202603314707	CG202603318243	121	盛大印刷	牧区纯坊官方品牌	2025-10-01	360.00	0.00	0.00	[{"num": 1000, "spec": "0", "price": 0.32, "unit_id": 0, "goods_id": 998, "goods_sn": "SP0000036", "unit_name": "张", "goods_name": "茶专用/硫酸纸", "total_price": 320}, {"num": 1000, "spec": "0", "price": 0.04, "unit_id": 0, "goods_id": 999, "goods_sn": "SP0000035", "unit_name": "张", "goods_name": "茶专用/不干胶/标签", "total_price": 40}]	从saas.mzth.cn导入 原单号:CG0002154	0	0		0		2026-03-31 02:38:40.03547	\N
478	CG202603319038	CG202603311857	106	拼多多/热缩膜	牧区纯坊官方品牌	2025-10-01	100.00	0.00	0.00	[{"num": 10, "spec": "0", "price": 10, "unit_id": 0, "goods_id": 995, "goods_sn": "SP0000039", "unit_name": "捆", "goods_name": "茶专用/热缩膜", "total_price": 100}]	从saas.mzth.cn导入 原单号:CG0002173	0	0		0		2026-03-31 02:38:38.525313	\N
477	CG202603318635	CG202603319609	123	银河包装	牧区纯坊官方品牌	2025-10-01	400.00	0.00	0.00	[{"num": 200, "spec": "1", "price": 2, "unit_id": 0, "goods_id": 1009, "goods_sn": "SP0000025", "unit_name": "张", "goods_name": "专盒/青砖奶茶外盒", "total_price": 400}]	从saas.mzth.cn导入 原单号:CG0002174	0	0		0		2026-03-31 02:38:37.15983	\N
476	CG202603315898	CG202603319957	106	拼多多/热缩膜	牧区纯坊官方品牌	2025-10-01	50.00	0.00	0.00	[{"num": 500, "spec": "1", "price": 0.1, "unit_id": 0, "goods_id": 993, "goods_sn": "SP0000041", "unit_name": "张", "goods_name": "冻炒米专用/塑膜袋", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0002175	0	0		0		2026-03-31 02:38:35.87918	\N
351	CG202603311089	CG202603316113	98	科尔沁奶食品	1号店员专用	2026-03-01	110.00	0.00	0.00	[{"num": 5, "spec": "1斤散称", "price": 22, "unit_id": 0, "goods_id": 902, "goods_sn": "SP0000133", "unit_name": "斤", "goods_name": "乌日莫糖/散装", "total_price": 110}]	从saas.mzth.cn导入 原单号:CG0004469	0	0		0		2026-03-31 02:34:15.45678	\N
474	CG202603318624	CG202603316760	106	拼多多/热缩膜	牧区纯坊官方品牌	2025-10-01	100.00	0.00	0.00	[{"num": 1000, "spec": "1", "price": 0.1, "unit_id": 0, "goods_id": 990, "goods_sn": "SP0000044", "unit_name": "袋", "goods_name": "奶果子/专用塑膜袋", "total_price": 100}]	从saas.mzth.cn导入 原单号:CG0002177	0	0		0		2026-03-31 02:38:33.914379	\N
473	CG202603316040	CG202603313561	105	翁牛特旗奶果子	牧区纯坊官方品牌	2025-10-01	360.00	0.00	0.00	[{"num": 14.4, "spec": "平均一块儿", "price": 25, "unit_id": 0, "goods_id": 991, "goods_sn": "SP0000043", "unit_name": "斤", "goods_name": "奶果子/散装", "total_price": 360}]	从saas.mzth.cn导入 原单号:CG0002178	0	0		0		2026-03-31 02:38:32.943304	\N
475	CG202603316864	CG202603313498	105	翁牛特旗奶果子	牧区纯坊官方品牌	2025-10-01	456.00	0.00	0.00	[{"num": 18.24, "spec": "平均一块儿", "price": 25, "unit_id": 0, "goods_id": 991, "goods_sn": "SP0000043", "unit_name": "斤", "goods_name": "奶果子/散装", "total_price": 456}]	从saas.mzth.cn导入 原单号:CG0002176	0	0		0		2026-03-31 02:38:34.894774	\N
470	CG202603313299	CG202603313871	116	恩赫奶制品厂	牧区纯坊官方品牌	2025-10-10	270.00	0.00	0.00	[{"num": 15, "spec": "250克/一袋", "price": 18, "unit_id": 0, "goods_id": 1015, "goods_sn": "SP0000019", "unit_name": "斤", "goods_name": "散装/原味奶条", "total_price": 270}]	从saas.mzth.cn导入 原单号:CG0002022	0	0		0		2026-03-31 02:38:29.977498	\N
469	CG202603313258	CG202603311647	111	优如包装	牧区纯坊官方品牌	2025-10-11	7500.01	0.00	0.00	[{"num": 3030, "spec": "1", "price": 2.47525, "unit_id": 0, "goods_id": 1009, "goods_sn": "SP0000025", "unit_name": "张", "goods_name": "专盒/青砖奶茶外盒", "total_price": 7500.01}]	从saas.mzth.cn导入 原单号:CG0002028	0	0		0		2026-03-31 02:38:27.146622	\N
485	CG202603317878	CG202603314893	120	淘宝紫辰包装	牧区纯坊官方品牌	2025-09-30	56.10	0.00	0.00	[{"num": 79, "spec": "1", "price": 0.55, "unit_id": 0, "goods_id": 1022, "goods_sn": "SP0000012", "unit_name": "张", "goods_name": "专袋/传统奶豆腐", "total_price": 43.45}, {"num": 23, "spec": "1", "price": 0.55, "unit_id": 0, "goods_id": 1022, "goods_sn": "SP0000012", "unit_name": "张", "goods_name": "专袋/传统奶豆腐", "total_price": 12.65}]	从saas.mzth.cn导入 原单号:CG0002017	0	0		0		2026-03-31 02:38:50.569473	\N
484	CG202603312052	CG202603315759	120	淘宝紫辰包装	牧区纯坊官方品牌	2025-09-30	3.40	0.00	0.00	[{"num": 20, "spec": "1", "price": 0.17, "unit_id": 0, "goods_id": 1027, "goods_sn": "SP0000007", "unit_name": "张", "goods_name": "真空袋", "total_price": 3.4}]	从saas.mzth.cn导入 原单号:CG0002018	0	0		0		2026-03-31 02:38:48.969312	\N
502	CG202603318815	CG202603311054	123	银河包装	牧区纯坊官方品牌	2025-09-30	200.93	0.00	0.00	[{"num": 51, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 36.21}, {"num": 84, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 59.64}, {"num": 2, "spec": "1", "price": 35.5, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "捆", "goods_name": "专袋/奶条", "total_price": 71}, {"num": 48, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 34.08}]	从saas.mzth.cn导入 原单号:CG0002000	0	0		0		2026-03-31 02:39:29.078483	\N
483	CG202603313843	CG202603317580	118	淘宝/江苏永发玻璃制品厂	牧区纯坊官方品牌	2025-09-30	89.10	0.00	0.00	[{"num": 55, "spec": "100ML", "price": 1.62, "unit_id": 0, "goods_id": 1016, "goods_sn": "SP0000018", "unit_name": "瓶", "goods_name": "专瓶/黄油", "total_price": 89.1}]	从saas.mzth.cn导入 原单号:CG0002019	0	0		0		2026-03-31 02:38:48.000655	\N
487	CG202603318956	CG202603311277	123	银河包装	牧区纯坊官方品牌	2025-09-30	5751.26	0.00	0.00	[{"num": 17, "spec": "1", "price": 35.5, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "捆", "goods_name": "专袋/奶条", "total_price": 603.5}, {"num": 16, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 11.36}, {"num": 47, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 33.37}, {"num": 7, "spec": "1", "price": 35.5, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "捆", "goods_name": "专袋/奶条", "total_price": 248.5}, {"num": 79, "spec": "1", "price": 18.5, "unit_id": 0, "goods_id": 1031, "goods_sn": "SP0000003", "unit_name": "捆", "goods_name": "专底盒/奶条", "total_price": 1461.5}, {"num": 33, "spec": "1", "price": 0.37, "unit_id": 0, "goods_id": 1031, "goods_sn": "SP0000003", "unit_name": "张", "goods_name": "专底盒/奶条", "total_price": 12.21}, {"num": 6, "spec": "1", "price": 0.65, "unit_id": 0, "goods_id": 1030, "goods_sn": "SP0000004", "unit_name": "张", "goods_name": "专外盒/奶果子", "total_price": 3.9}, {"num": 34, "spec": "1", "price": 32.5, "unit_id": 0, "goods_id": 1030, "goods_sn": "SP0000004", "unit_name": "捆", "goods_name": "专外盒/奶果子", "total_price": 1105}, {"num": 24, "spec": "1", "price": 0.65, "unit_id": 0, "goods_id": 1029, "goods_sn": "SP0000005", "unit_name": "张", "goods_name": "专内盒/奶果子", "total_price": 15.6}, {"num": 37, "spec": "1", "price": 26, "unit_id": 0, "goods_id": 1029, "goods_sn": "SP0000005", "unit_name": "捆", "goods_name": "专内盒/奶果子", "total_price": 962}, {"num": 25, "spec": "1", "price": 0.08, "unit_id": 0, "goods_id": 1026, "goods_sn": "SP0000008", "unit_name": "张", "goods_name": "专内袋/奶果子", "total_price": 2}, {"num": 82, "spec": "1", "price": 15.76, "unit_id": 0, "goods_id": 1026, "goods_sn": "SP0000008", "unit_name": "捆", "goods_name": "专内袋/奶果子", "total_price": 1292.32}]	从saas.mzth.cn导入 原单号:CG0002015	0	0		0		2026-03-31 02:39:00.712892	\N
255	CG202603305256	CG202603301518	90	阿润查干	牧区纯坊官方品牌	2025-12-25	182.00	0.00	0.00	[{"num": 4, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 880, "goods_sn": "SP0000155", "unit_name": "袋", "goods_name": "阿润月饼/五仁馅", "total_price": 40}, {"num": 4, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 879, "goods_sn": "SP0000156", "unit_name": "盒", "goods_name": "干肉奶茶", "total_price": 22}, {"num": 4, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 881, "goods_sn": "SP0000154", "unit_name": "袋", "goods_name": "阿润月饼/奶皮子馅", "total_price": 40}, {"num": 4, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 882, "goods_sn": "SP0000153", "unit_name": "袋", "goods_name": "阿润月饼/黄油渣馅", "total_price": 40}, {"num": 4, "spec": "4颗/350克", "price": 10, "unit_id": 0, "goods_id": 883, "goods_sn": "SP0000152", "unit_name": "袋", "goods_name": "阿润月饼/奶豆腐馅", "total_price": 40}]	从saas.mzth.cn导入 原单号:CG0003285	0	0		0		2026-03-30 17:37:39.40899	\N
495	CG202603313713	CG202603314713	122	沈阳东源包材厂	牧区纯坊官方品牌	2025-09-30	2381.12	0.00	0.00	[{"num": 16, "spec": "1", "price": 0.07, "unit_id": 0, "goods_id": 1025, "goods_sn": "SP0000009", "unit_name": "张", "goods_name": "定制款/专内袋/扎那家奶果子", "total_price": 1.12}, {"num": 170, "spec": "1", "price": 14, "unit_id": 0, "goods_id": 1025, "goods_sn": "SP0000009", "unit_name": "捆", "goods_name": "定制款/专内袋/扎那家奶果子", "total_price": 2380}]	从saas.mzth.cn导入 原单号:CG0002007	0	0		0		2026-03-31 02:39:16.341906	\N
494	CG202603312835	CG202603311700	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	5.20	0.00	0.00	[{"num": 77, "spec": "1", "price": 0.05, "unit_id": 0, "goods_id": 1024, "goods_sn": "SP0000010", "unit_name": "张", "goods_name": "标签/不干胶/奶条/甜味", "total_price": 3.85}, {"num": 27, "spec": "1", "price": 0.05, "unit_id": 0, "goods_id": 1023, "goods_sn": "SP0000011", "unit_name": "张", "goods_name": "标签/不干胶/奶条/原味", "total_price": 1.35}]	从saas.mzth.cn导入 原单号:CG0002008	0	0		0		2026-03-31 02:39:13.767545	\N
493	CG202603317171	CG202603317026	120	淘宝紫辰包装	牧区纯坊官方品牌	2025-09-30	49.50	0.00	0.00	[{"num": 90, "spec": "1", "price": 0.55, "unit_id": 0, "goods_id": 1022, "goods_sn": "SP0000012", "unit_name": "张", "goods_name": "专袋/传统奶豆腐", "total_price": 49.5}]	从saas.mzth.cn导入 原单号:CG0002009	0	0		0		2026-03-31 02:39:12.268134	\N
492	CG202603319135	CG202603312374	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	1.74	0.00	0.00	[{"num": 14, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 0.84}, {"num": 15, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 0.9}]	从saas.mzth.cn导入 原单号:CG0002010	0	0		0		2026-03-31 02:39:11.110064	\N
491	CG202603315123	CG202603318344	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	0.39	0.00	0.00	[{"num": 13, "spec": "1", "price": 0.03, "unit_id": 0, "goods_id": 1020, "goods_sn": "SP0000014", "unit_name": "张", "goods_name": "标签/不干胶/奶果子", "total_price": 0.39}]	从saas.mzth.cn导入 原单号:CG0002011	0	0		0		2026-03-31 02:39:09.483367	\N
490	CG202603316376	CG202603316897	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	1469.00	0.00	0.00	[{"num": 500, "spec": "1", "price": 0.067, "unit_id": 0, "goods_id": 1019, "goods_sn": "SP0000015", "unit_name": "张", "goods_name": "标签/不干胶/冻炒米", "total_price": 33.5}, {"num": 1650, "spec": "1", "price": 0.87, "unit_id": 0, "goods_id": 1032, "goods_sn": "SP0000002", "unit_name": "张", "goods_name": "专盒/冻炒米", "total_price": 1435.5}]	从saas.mzth.cn导入 原单号:CG0002012	0	0		0		2026-03-31 02:39:08.508826	\N
501	CG202603313025	CG202603317523	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	27.84	0.00	0.00	[{"num": 32, "spec": "1", "price": 0.87, "unit_id": 0, "goods_id": 1032, "goods_sn": "SP0000002", "unit_name": "张", "goods_name": "专盒/冻炒米", "total_price": 27.84}]	从saas.mzth.cn导入 原单号:CG0002001	0	0		0		2026-03-31 02:39:26.645339	\N
500	CG202603319057	CG202603318723	123	银河包装	牧区纯坊官方品牌	2025-09-30	66.60	0.00	0.00	[{"num": 30, "spec": "1", "price": 0.37, "unit_id": 0, "goods_id": 1031, "goods_sn": "SP0000003", "unit_name": "张", "goods_name": "专底盒/奶条", "total_price": 11.1}, {"num": 3, "spec": "1", "price": 18.5, "unit_id": 0, "goods_id": 1031, "goods_sn": "SP0000003", "unit_name": "捆", "goods_name": "专底盒/奶条", "total_price": 55.5}]	从saas.mzth.cn导入 原单号:CG0002002	0	0		0		2026-03-31 02:39:25.628386	\N
499	CG202603312326	CG202603319033	123	银河包装	牧区纯坊官方品牌	2025-09-30	9.10	0.00	0.00	[{"num": 8, "spec": "1", "price": 0.65, "unit_id": 0, "goods_id": 1029, "goods_sn": "SP0000005", "unit_name": "张", "goods_name": "专内盒/奶果子", "total_price": 5.2}, {"num": 6, "spec": "1", "price": 0.65, "unit_id": 0, "goods_id": 1030, "goods_sn": "SP0000004", "unit_name": "张", "goods_name": "专外盒/奶果子", "total_price": 3.9}]	从saas.mzth.cn导入 原单号:CG0002003	0	0		0		2026-03-31 02:39:24.112648	\N
498	CG202603314925	CG202603312257	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	0.96	0.00	0.00	[{"num": 16, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1028, "goods_sn": "SP0000006", "unit_name": "张", "goods_name": "专标签/黄油", "total_price": 0.96}]	从saas.mzth.cn导入 原单号:CG0002004	0	0		0		2026-03-31 02:39:22.486582	\N
497	CG202603314472	CG202603313861	120	淘宝紫辰包装	牧区纯坊官方品牌	2025-09-30	10.20	0.00	0.00	[{"num": 60, "spec": "1", "price": 0.17, "unit_id": 0, "goods_id": 1027, "goods_sn": "SP0000007", "unit_name": "张", "goods_name": "真空袋", "total_price": 10.2}]	从saas.mzth.cn导入 原单号:CG0002005	0	0		0		2026-03-31 02:39:19.711661	\N
496	CG202603311551	CG202603317665	123	银河包装	牧区纯坊官方品牌	2025-09-30	206.16	0.00	0.00	[{"num": 16, "spec": "1", "price": 0.08, "unit_id": 0, "goods_id": 1026, "goods_sn": "SP0000008", "unit_name": "张", "goods_name": "专内袋/奶果子", "total_price": 1.28}, {"num": 13, "spec": "1", "price": 15.76, "unit_id": 0, "goods_id": 1026, "goods_sn": "SP0000008", "unit_name": "捆", "goods_name": "专内袋/奶果子", "total_price": 204.88}]	从saas.mzth.cn导入 原单号:CG0002006	0	0		0		2026-03-31 02:39:18.697328	\N
466	CG202603311175	CG202603317794	116	恩赫奶制品厂	牧区纯坊官方品牌	2025-10-20	284.40	0.00	0.00	[{"num": 15.8, "spec": "250克/一袋", "price": 18, "unit_id": 0, "goods_id": 1015, "goods_sn": "SP0000019", "unit_name": "斤", "goods_name": "散装/原味奶条", "total_price": 284.4}]	从saas.mzth.cn导入 原单号:CG0002417	0	0		0		2026-03-31 02:38:22.192737	\N
465	CG202603318976	CG202603313170	116	恩赫奶制品厂	牧区纯坊官方品牌	2025-10-20	82.80	0.00	0.00	[{"num": 9.2, "spec": "250克/一袋", "price": 9, "unit_id": 0, "goods_id": 1015, "goods_sn": "SP0000019", "unit_name": "斤", "goods_name": "散装/原味奶条", "total_price": 82.8}]	从saas.mzth.cn导入 原单号:CG0002951	0	0		0		2026-03-31 02:38:21.224127	\N
489	CG202603319788	CG202603311453	119	沈阳乾兴包装	牧区纯坊官方品牌	2025-09-30	254.80	0.00	0.00	[{"num": 30, "spec": "1", "price": 4.55, "unit_id": 0, "goods_id": 1018, "goods_sn": "SP0000016", "unit_name": "张", "goods_name": "礼盒/蓝界", "total_price": 136.5}, {"num": 26, "spec": "1", "price": 4.55, "unit_id": 0, "goods_id": 1018, "goods_sn": "SP0000016", "unit_name": "张", "goods_name": "礼盒/蓝界", "total_price": 118.3}]	从saas.mzth.cn导入 原单号:CG0002013	0	0		0		2026-03-31 02:39:06.938415	\N
464	CG202603316258	CG202603312892	110	淘宝欧信	牧区纯坊官方品牌	2025-10-22	1700.00	0.00	0.00	[{"num": 1, "spec": "1", "price": 1700, "unit_id": 0, "goods_id": 1003, "goods_sn": "SP0000031", "unit_name": "台", "goods_name": "热收缩膜机", "total_price": 1700}]	从saas.mzth.cn导入 原单号:CG0002151	0	0		0		2026-03-31 02:38:20.038159	\N
276	CG202603305241	CG202603304763	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-10	526.00	0.00	0.00	[{"num": 30, "spec": "1斤", "price": 5.46667, "unit_id": 0, "goods_id": 901, "goods_sn": "SP0000134", "unit_name": "麻袋", "goods_name": "手工白花炒米/散装", "total_price": 164}, {"num": 5, "spec": "1斤散称", "price": 22, "unit_id": 0, "goods_id": 902, "goods_sn": "SP0000133", "unit_name": "斤", "goods_name": "乌日莫糖/散装", "total_price": 110}, {"num": 4, "spec": "250克", "price": 8, "unit_id": 0, "goods_id": 915, "goods_sn": "SP0000120", "unit_name": "盒", "goods_name": "黄油渣/盒", "total_price": 32}, {"num": 10, "spec": "斤/两盒", "price": 22, "unit_id": 0, "goods_id": 981, "goods_sn": "SP0000053", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 220}]	从saas.mzth.cn导入 原单号:CG0002950	0	0		0		2026-03-30 17:38:10.713599	\N
481	CG202603317526	CG202603319598	108	山东锦食食品	牧区纯坊官方品牌	2025-10-01	151.10	0.00	0.00	[{"num": 2, "spec": "2g", "price": 68.75, "unit_id": 0, "goods_id": 997, "goods_sn": "SP0000037", "unit_name": "件", "goods_name": "茶专用/盐包", "total_price": 137.5}, {"num": 200, "spec": "2g", "price": 0.068, "unit_id": 0, "goods_id": 997, "goods_sn": "SP0000037", "unit_name": "小包", "goods_name": "茶专用/盐包", "total_price": 13.6}]	从saas.mzth.cn导入 原单号:CG0002152	0	0		0		2026-03-31 02:38:43.052798	\N
468	CG202603315878	CG202603316532	117	巴音珠萨朗	牧区纯坊官方品牌	2025-10-12	422.56	0.00	0.00	[{"num": 16.41, "spec": "250克/一袋", "price": 16, "unit_id": 0, "goods_id": 1014, "goods_sn": "SP0000020", "unit_name": "斤", "goods_name": "散装/甜味奶条", "total_price": 262.56}, {"num": 10, "spec": "250克/一袋", "price": 16, "unit_id": 0, "goods_id": 1014, "goods_sn": "SP0000020", "unit_name": "斤", "goods_name": "散装/甜味奶条", "total_price": 160}]	从saas.mzth.cn导入 原单号:CG0002021	0	0		0		2026-03-31 02:38:25.135283	\N
459	CG202603313284	CG202603311955	114	阿旗北方	牧区纯坊官方品牌	2025-11-01	46.80	0.00	0.00	[{"num": 1, "spec": "100克", "price": 7.08, "unit_id": 0, "goods_id": 989, "goods_sn": "SP0000045", "unit_name": "瓶", "goods_name": "蒙古黄油/瓶装成品", "total_price": 7.08}, {"num": 2, "spec": "100克", "price": 7.08, "unit_id": 0, "goods_id": 989, "goods_sn": "SP0000045", "unit_name": "瓶", "goods_name": "蒙古黄油/瓶装成品", "total_price": 14.16}, {"num": 2, "spec": "150", "price": 12.78, "unit_id": 0, "goods_id": 988, "goods_sn": "SP0000046", "unit_name": "袋", "goods_name": "原味传统奶豆腐/成品袋装", "total_price": 25.56}]	从saas.mzth.cn导入 原单号:CG0002419	0	0		0		2026-03-31 02:38:13.448733	\N
449	CG202603318843	CG202603318280	105	翁牛特旗奶果子	牧区纯坊官方品牌	2025-11-30	2146.00	0.00	0.00	[{"num": 85.84, "spec": "平均一块儿", "price": 25, "unit_id": 0, "goods_id": 991, "goods_sn": "SP0000043", "unit_name": "斤", "goods_name": "奶果子/散装", "total_price": 2146}]	从saas.mzth.cn导入 原单号:CG0002800	0	0		0		2026-03-31 02:37:53.622522	\N
445	CG202603311756	CG202603317274	97	纯净奶食品	牧区纯坊官方品牌	2025-12-03	2359.60	0.00	0.00	[{"num": 10, "spec": "45散称/斤/9元/100克", "price": 45, "unit_id": 0, "goods_id": 972, "goods_sn": "SP0000062", "unit_name": "斤", "goods_name": "原味/散称/奶豆腐块儿", "total_price": 450}, {"num": 10, "spec": "45散称/斤/9元/100克", "price": 45, "unit_id": 0, "goods_id": 971, "goods_sn": "SP0000063", "unit_name": "斤", "goods_name": "甜味/散称/奶豆腐块儿", "total_price": 450}, {"num": 38, "spec": "140克", "price": 4.2, "unit_id": 0, "goods_id": 965, "goods_sn": "SP0000069", "unit_name": "盒", "goods_name": "半成品/透明/冻炒米", "total_price": 159.6}, {"num": 50, "spec": "200克", "price": 10, "unit_id": 0, "goods_id": 970, "goods_sn": "SP0000064", "unit_name": "盒", "goods_name": "热奶豆腐碗", "total_price": 500}, {"num": 30, "spec": "150-180克", "price": 13, "unit_id": 0, "goods_id": 968, "goods_sn": "SP0000066", "unit_name": "张", "goods_name": "大/奶皮", "total_price": 390}, {"num": 30, "spec": "120-150克", "price": 10, "unit_id": 0, "goods_id": 969, "goods_sn": "SP0000065", "unit_name": "张", "goods_name": "小/奶皮", "total_price": 300}, {"num": 5, "spec": "4斤装", "price": 4, "unit_id": 0, "goods_id": 967, "goods_sn": "SP0000067", "unit_name": "桶", "goods_name": "查嘎/乳清", "total_price": 20}, {"num": 30, "spec": "50克", "price": 3, "unit_id": 0, "goods_id": 966, "goods_sn": "SP0000068", "unit_name": "小包", "goods_name": "查嘎粉/小包装袋", "total_price": 90}]	从saas.mzth.cn导入 原单号:CG0002851	0	0		0		2026-03-31 02:37:47.72618	\N
439	CG202603314856	CG202603313487	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2025-12-05	220.00	0.00	0.00	[{"num": 40, "spec": "1", "price": 5.5, "unit_id": 0, "goods_id": 1013, "goods_sn": "SP0000021", "unit_name": "盒", "goods_name": "冻炒米/给组装半成品/那牧尔", "total_price": 220}]	从saas.mzth.cn导入 原单号:CG0002857	0	0		0		2026-03-31 02:37:27.551133	\N
415	CG202603312070	CG202603315567	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-17	555.00	0.00	0.00	[{"num": 20, "spec": "半斤", "price": 14, "unit_id": 0, "goods_id": 916, "goods_sn": "SP0000119", "unit_name": "斤", "goods_name": "脆奶条/散装/科尔沁", "total_price": 280}, {"num": 7, "spec": "1盒", "price": 15, "unit_id": 0, "goods_id": 889, "goods_sn": "SP0000146", "unit_name": "盒", "goods_name": "奶皮卷/科尔沁", "total_price": 105}, {"num": 2, "spec": "1", "price": 7, "unit_id": 0, "goods_id": 886, "goods_sn": "SP0000149", "unit_name": "盒", "goods_name": "冻炒米/科尔沁", "total_price": 14}, {"num": 4, "spec": "320克", "price": 25, "unit_id": 0, "goods_id": 887, "goods_sn": "SP0000148", "unit_name": "盒", "goods_name": "羊乳奶粉/奶茶专用", "total_price": 100}, {"num": 4, "spec": "320克", "price": 14, "unit_id": 0, "goods_id": 888, "goods_sn": "SP0000147", "unit_name": "盒", "goods_name": "河套奶粉", "total_price": 56}]	从saas.mzth.cn导入 原单号:CG0003078	0	0		0		2026-03-31 02:36:29.230719	\N
430	CG202603319340	CG202603312319	98	科尔沁奶食品	牧区纯坊官方品牌	2025-12-10	526.00	0.00	0.00	[{"num": 30, "spec": "1斤", "price": 5.46667, "unit_id": 0, "goods_id": 901, "goods_sn": "SP0000134", "unit_name": "麻袋", "goods_name": "手工白花炒米/散装", "total_price": 164}, {"num": 5, "spec": "1斤散称", "price": 22, "unit_id": 0, "goods_id": 902, "goods_sn": "SP0000133", "unit_name": "斤", "goods_name": "乌日莫糖/散装", "total_price": 110}, {"num": 4, "spec": "250克", "price": 8, "unit_id": 0, "goods_id": 915, "goods_sn": "SP0000120", "unit_name": "盒", "goods_name": "黄油渣/盒", "total_price": 32}, {"num": 10, "spec": "斤/两盒", "price": 22, "unit_id": 0, "goods_id": 981, "goods_sn": "SP0000053", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 220}]	从saas.mzth.cn导入 原单号:CG0002950	0	0		0		2026-03-31 02:37:01.292739	\N
429	CG202603319006	CG202603312647	116	恩赫奶制品厂	牧区纯坊官方品牌	2025-12-10	554.40	0.00	0.00	[{"num": 30.8, "spec": "250克/一袋", "price": 18, "unit_id": 0, "goods_id": 1015, "goods_sn": "SP0000019", "unit_name": "斤", "goods_name": "散装/原味奶条", "total_price": 554.4}]	从saas.mzth.cn导入 原单号:CG0002952	0	0		0		2026-03-31 02:36:56.603987	\N
427	CG202603319218	CG202603316462	121	盛大印刷	牧区纯坊官方品牌	2025-12-10	963.00	0.00	0.00	[{"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 900, "goods_sn": "SP0000135", "unit_name": "张", "goods_name": "透专标签/脆香奶条/微甜", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 950, "goods_sn": "SP0000085", "unit_name": "张", "goods_name": "透专标签/奶皮卷", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 951, "goods_sn": "SP0000084", "unit_name": "张", "goods_name": "透专标签/冻炒米", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 952, "goods_sn": "SP0000083", "unit_name": "张", "goods_name": "透专标签/奶酪/原味", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 953, "goods_sn": "SP0000082", "unit_name": "张", "goods_name": "透专标签/奶酪/甜味", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 956, "goods_sn": "SP0000079", "unit_name": "张", "goods_name": "透专标签/鲜奶皮", "total_price": 160.5}]	从saas.mzth.cn导入 原单号:CG0002955	0	0		0		2026-03-31 02:36:54.17581	\N
399	CG202603317448	CG202603313290	97	纯净奶食品	牧区纯坊官方品牌	2026-01-01	424.40	0.00	0.00	[{"num": 21, "spec": "150克", "price": 12, "unit_id": 0, "goods_id": 944, "goods_sn": "SP0000091", "unit_name": "盒", "goods_name": "半成品/透明/奶皮千层", "total_price": 252}, {"num": 10, "spec": "1", "price": 15, "unit_id": 0, "goods_id": 885, "goods_sn": "SP0000150", "unit_name": "斤", "goods_name": "冻炒米/散装", "total_price": 150}, {"num": 100, "spec": "7克/包", "price": 0.224, "unit_id": 0, "goods_id": 863, "goods_sn": "SP0000172", "unit_name": "个", "goods_name": "冻炒米/小包散/精品", "total_price": 22.4}]	从saas.mzth.cn导入 原单号:CG0003668	0	0		0		2026-03-31 02:35:43.465017	\N
369	CG202603315234	CG202603319794	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-01	1163.00	0.00	0.00	[{"num": 40, "spec": "斤/两盒", "price": 22, "unit_id": 0, "goods_id": 981, "goods_sn": "SP0000053", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 880}, {"num": 3, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 903, "goods_sn": "SP0000132", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/甜味", "total_price": 57}, {"num": 4, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 904, "goods_sn": "SP0000131", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/原味", "total_price": 76}, {"num": 10, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 150}]	从saas.mzth.cn导入 原单号:CG0004239	0	0		0		2026-03-31 02:34:53.584869	\N
372	CG202603314311	CG202603312825	81	额吉伊德	牧区纯坊官方品牌	2026-01-27	161.00	0.00	0.00	[{"num": 20, "spec": "250克", "price": 4.5, "unit_id": 0, "goods_id": 845, "goods_sn": "SP0000190", "unit_name": "瓶", "goods_name": "乳清饮料", "total_price": 90}, {"num": 6, "spec": "250克", "price": 6, "unit_id": 0, "goods_id": 846, "goods_sn": "SP0000189", "unit_name": "瓶", "goods_name": "酸奶/额吉伊德", "total_price": 36}, {"num": 5, "spec": "500克", "price": 7, "unit_id": 0, "goods_id": 847, "goods_sn": "SP0000188", "unit_name": "袋", "goods_name": "乌日莫/袋装", "total_price": 35}]	从saas.mzth.cn导入 原单号:CG0004116	0	0		0		2026-03-31 02:35:03.362411	\N
374	CG202603319664	CG202603317629	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-24	400.00	0.00	0.00	[{"num": 5, "spec": "1斤散称", "price": 22, "unit_id": 0, "goods_id": 902, "goods_sn": "SP0000133", "unit_name": "斤", "goods_name": "乌日莫糖/散装", "total_price": 110}, {"num": 5, "spec": "1斤散称", "price": 10, "unit_id": 0, "goods_id": 922, "goods_sn": "SP0000113", "unit_name": "斤", "goods_name": "酸奶炒米糖/散装", "total_price": 50}, {"num": 5, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 75}, {"num": 5, "spec": "1.2", "price": 33, "unit_id": 0, "goods_id": 856, "goods_sn": "SP0000179", "unit_name": "张", "goods_name": "科尔沁/大奶豆腐", "total_price": 165}]	从saas.mzth.cn导入 原单号:CG0004043	0	0		0		2026-03-31 02:35:06.963197	\N
383	CG202603317632	CG202603319977	98	科尔沁奶食品	牧区纯坊官方品牌	2026-01-17	378.00	0.00	0.00	[{"num": 10, "spec": "斤/两盒", "price": 22, "unit_id": 0, "goods_id": 981, "goods_sn": "SP0000053", "unit_name": "斤", "goods_name": "烤奶皮", "total_price": 220}, {"num": 30, "spec": "1斤", "price": 5.26667, "unit_id": 0, "goods_id": 901, "goods_sn": "SP0000134", "unit_name": "麻袋", "goods_name": "手工白花炒米/散装", "total_price": 158}]	从saas.mzth.cn导入 原单号:CG0003873	0	0		0		2026-03-31 02:35:19.5777	\N
296	CG202603305055	CG202603306927	121	盛大印刷	牧区纯坊官方品牌	2025-11-16	594.69	0.00	0.00	[{"num": 500, "spec": "1", "price": 0.0578, "unit_id": 0, "goods_id": 1019, "goods_sn": "SP0000015", "unit_name": "张", "goods_name": "标签/不干胶/冻炒米", "total_price": 28.9}, {"num": 2000, "spec": "一张", "price": 0.181, "unit_id": 0, "goods_id": 984, "goods_sn": "SP0000050", "unit_name": "3009", "goods_name": "茶包/类腰封纸", "total_price": 362}, {"num": 500, "spec": "1", "price": 0.0816, "unit_id": 0, "goods_id": 975, "goods_sn": "SP0000059", "unit_name": "张", "goods_name": "黄油脖签", "total_price": 40.8}, {"num": 3000, "spec": "1", "price": 0.05433, "unit_id": 0, "goods_id": 978, "goods_sn": "SP0000056", "unit_name": "张", "goods_name": "新茶专用标签纸", "total_price": 162.99}]	从saas.mzth.cn导入 原单号:CG0002609	0	0		0		2026-03-30 17:38:56.765264	\N
288	CG202603302397	CG202603304689	97	纯净奶食品	牧区纯坊官方品牌	2025-12-04	772.00	0.00	0.00	[{"num": 20, "spec": "150克", "price": 14.5, "unit_id": 0, "goods_id": 973, "goods_sn": "SP0000061", "unit_name": "袋", "goods_name": "精品/奶豆腐块儿/甜味/", "total_price": 290}, {"num": 20, "spec": "150克", "price": 14.5, "unit_id": 0, "goods_id": 986, "goods_sn": "SP0000048", "unit_name": "袋", "goods_name": "精品/奶豆腐块儿/原味", "total_price": 290}, {"num": 32, "spec": "1", "price": 6, "unit_id": 0, "goods_id": 974, "goods_sn": "SP0000060", "unit_name": "瓶", "goods_name": "纯净黄油/瓶装好的", "total_price": 192}]	从saas.mzth.cn导入 原单号:CG0002852	0	0		0		2026-03-30 17:38:43.058876	\N
409	CG202603315570	CG202603314468	97	纯净奶食品	牧区纯坊官方品牌	2025-12-25	2310.00	0.00	0.00	[{"num": 40, "spec": "180克", "price": 14, "unit_id": 0, "goods_id": 946, "goods_sn": "SP0000089", "unit_name": "盒", "goods_name": "半成品/透明/鲜奶皮", "total_price": 560}, {"num": 50, "spec": "180克", "price": 13, "unit_id": 0, "goods_id": 945, "goods_sn": "SP0000090", "unit_name": "盒", "goods_name": "半成品/透明/奶皮卷", "total_price": 650}, {"num": 20, "spec": "150克", "price": 12, "unit_id": 0, "goods_id": 944, "goods_sn": "SP0000091", "unit_name": "盒", "goods_name": "半成品/透明/奶皮千层", "total_price": 240}, {"num": 35, "spec": "1", "price": 6, "unit_id": 0, "goods_id": 974, "goods_sn": "SP0000060", "unit_name": "瓶", "goods_name": "纯净黄油/瓶装好的", "total_price": 210}, {"num": 10, "spec": "1斤装", "price": 22, "unit_id": 0, "goods_id": 899, "goods_sn": "SP0000136", "unit_name": "瓶", "goods_name": "纯净/黄油/斤", "total_price": 220}, {"num": 4, "spec": "斤", "price": 10, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 40}, {"num": 30, "spec": "150-180克", "price": 13, "unit_id": 0, "goods_id": 968, "goods_sn": "SP0000066", "unit_name": "张", "goods_name": "大/奶皮", "total_price": 390}]	从saas.mzth.cn导入 原单号:CG0003286	0	0		0		2026-03-31 02:36:11.454396	\N
364	CG202603319631	CG202603319361	78	小米厂家阿旗	牧区纯坊官方品牌	2026-02-08	573.00	0.00	0.00	[{"num": 2, "spec": "2.5kg", "price": 19, "unit_id": 0, "goods_id": 830, "goods_sn": "SP0000206", "unit_name": "袋", "goods_name": "小米/10斤/小袋", "total_price": 38}, {"num": 5, "spec": "2.5kg", "price": 19, "unit_id": 0, "goods_id": 830, "goods_sn": "SP0000206", "unit_name": "袋", "goods_name": "小米/10斤/小袋", "total_price": 95}, {"num": 8, "spec": "10斤装", "price": 55, "unit_id": 0, "goods_id": 809, "goods_sn": "SP0000227", "unit_name": "盒", "goods_name": "10斤装/小米/绿色纸盒", "total_price": 440}]	从saas.mzth.cn导入 原单号:CG0004363	0	0		0		2026-03-31 02:34:44.500533	\N
347	CG202603319515	CG202603314135	98	科尔沁奶食品	1号店员专用	2026-03-01	220.00	0.00	0.00	[{"num": 10, "spec": "斤/两盒", "price": 22, "unit_id": 0, "goods_id": 981, "goods_sn": "SP0000053", "unit_name": "盒", "goods_name": "烤奶皮", "total_price": 220}]	从saas.mzth.cn导入 原单号:CG0004473	0	0		0		2026-03-31 02:34:10.257147	\N
191	CG202603306496	CG202603304125	74	德吉奶食品	1号店员专用	2026-02-26	270.00	0.00	0.00	[{"num": 10, "spec": "1L", "price": 15, "unit_id": 0, "goods_id": 804, "goods_sn": "SP0000232", "unit_name": "瓶", "goods_name": "德吉酸奶/2斤装", "total_price": 150}, {"num": 10, "spec": "500mL", "price": 8, "unit_id": 0, "goods_id": 805, "goods_sn": "SP0000231", "unit_name": "瓶", "goods_name": "德吉酸奶/一斤装", "total_price": 80}, {"num": 10, "spec": "250mL", "price": 4, "unit_id": 0, "goods_id": 806, "goods_sn": "SP0000230", "unit_name": "瓶", "goods_name": "德吉酸奶/半斤", "total_price": 40}]	从saas.mzth.cn导入 原单号:CG0004475	0	0		0		2026-03-30 17:36:10.107675	\N
267	CG202603309372	CG202603302112	92	奥都奶食品	牧区纯坊官方品牌	2025-12-13	128.00	0.00	0.00	[{"num": 10, "spec": "斤", "price": 8, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 80}, {"num": 4, "spec": "斤", "price": 12, "unit_id": 0, "goods_id": 917, "goods_sn": "SP0000118", "unit_name": "斤", "goods_name": "机器乌日末液体", "total_price": 48}]	从saas.mzth.cn导入 原单号:CG0003007	0	0		0		2026-03-30 17:37:57.537427	\N
259	CG202603302336	CG202603303372	92	奥都奶食品	牧区纯坊官方品牌	2025-12-19	352.00	0.00	0.00	[{"num": 13.25, "spec": "1", "price": 16, "unit_id": 0, "goods_id": 885, "goods_sn": "SP0000150", "unit_name": "斤", "goods_name": "冻炒米/散装", "total_price": 212}, {"num": 5, "spec": "1", "price": 12, "unit_id": 0, "goods_id": 884, "goods_sn": "SP0000151", "unit_name": "个", "goods_name": "实惠/奶豆腐", "total_price": 60}, {"num": 10, "spec": "300克", "price": 8, "unit_id": 0, "goods_id": 924, "goods_sn": "SP0000111", "unit_name": "袋", "goods_name": "冻炒米/袋装", "total_price": 80}]	从saas.mzth.cn导入 原单号:CG0003106	0	0		0		2026-03-30 17:37:44.387637	\N
400	CG202603318600	CG202603317285	97	纯净奶食品	牧区纯坊官方品牌	2026-01-01	1396.00	0.00	0.00	[{"num": 10, "spec": "斤", "price": 10, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 100}, {"num": 36, "spec": "200克", "price": 10, "unit_id": 0, "goods_id": 970, "goods_sn": "SP0000064", "unit_name": "盒", "goods_name": "热奶豆腐碗", "total_price": 360}, {"num": 20, "spec": "200克", "price": 13, "unit_id": 0, "goods_id": 939, "goods_sn": "SP0000096", "unit_name": "盒", "goods_name": "半成品/透明/原味/鲜奶酪", "total_price": 260}, {"num": 52, "spec": "200克", "price": 13, "unit_id": 0, "goods_id": 940, "goods_sn": "SP0000095", "unit_name": "盒", "goods_name": "半成品/透明/甜味/鲜奶酪", "total_price": 676}]	从saas.mzth.cn导入 原单号:CG0003473	0	0		0		2026-03-31 02:35:46.521933	\N
358	CG202603315370	CG202603316675	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-14	965.00	0.00	0.00	[{"num": 2, "spec": "1斤", "price": 95, "unit_id": 0, "goods_id": 907, "goods_sn": "SP0000128", "unit_name": "袋", "goods_name": "风干牛肉500g大片", "total_price": 190}, {"num": 10, "spec": "半斤", "price": 14, "unit_id": 0, "goods_id": 916, "goods_sn": "SP0000119", "unit_name": "斤", "goods_name": "脆奶条/散装/科尔沁", "total_price": 140}, {"num": 5, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 903, "goods_sn": "SP0000132", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/甜味", "total_price": 95}, {"num": 5, "spec": "500g", "price": 19, "unit_id": 0, "goods_id": 904, "goods_sn": "SP0000131", "unit_name": "袋", "goods_name": "盛宇燃奶豆腐/原味", "total_price": 95}, {"num": 5, "spec": "半斤装", "price": 15, "unit_id": 0, "goods_id": 823, "goods_sn": "SP0000213", "unit_name": "瓶", "goods_name": "黄油/中瓶", "total_price": 75}, {"num": 5, "spec": "半斤装", "price": 21, "unit_id": 0, "goods_id": 822, "goods_sn": "SP0000214", "unit_name": "瓶", "goods_name": "黄油/大瓶/科尔沁", "total_price": 105}, {"num": 5, "spec": "1", "price": 19, "unit_id": 0, "goods_id": 829, "goods_sn": "SP0000207", "unit_name": "张", "goods_name": "奶豆腐/原味/中/科尔沁", "total_price": 95}, {"num": 2, "spec": "1斤", "price": 85, "unit_id": 0, "goods_id": 908, "goods_sn": "SP0000127", "unit_name": "袋", "goods_name": "哈斯乌拉牛肉干500g原味", "total_price": 170}]	从saas.mzth.cn导入 原单号:CG0004417	0	0		0		2026-03-31 02:34:31.756504	\N
349	CG202603319830	CG202603315314	98	科尔沁奶食品	1号店员专用	2026-03-01	50.00	0.00	0.00	[{"num": 5, "spec": "1斤散称", "price": 10, "unit_id": 0, "goods_id": 922, "goods_sn": "SP0000113", "unit_name": "斤", "goods_name": "酸奶炒米糖/散装", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0004471	0	0		0		2026-03-31 02:34:12.312726	\N
440	CG202603316877	CG202603316601	101	拼多多/随机店采购	牧区纯坊官方品牌	2025-12-05	124.62	0.00	0.00	[{"num": 100, "spec": "500克装", "price": 0.7882, "unit_id": 0, "goods_id": 949, "goods_sn": "SP0000086", "unit_name": "张", "goods_name": "专袋/乌日莫/炒米", "total_price": 78.82}, {"num": 100, "spec": "250克装", "price": 0.458, "unit_id": 0, "goods_id": 948, "goods_sn": "SP0000087", "unit_name": "张", "goods_name": "专袋/乌日莫", "total_price": 45.8}]	从saas.mzth.cn导入 原单号:CG0002856	0	0		0		2026-03-31 02:37:29.01005	\N
270	CG202603303089	CG202603304980	97	纯净奶食品	牧区纯坊官方品牌	2025-12-12	272.00	0.00	0.00	[{"num": 6, "spec": "1斤装", "price": 22, "unit_id": 0, "goods_id": 899, "goods_sn": "SP0000136", "unit_name": "瓶", "goods_name": "纯净/黄油/斤", "total_price": 132}, {"num": 10, "spec": "180克", "price": 14, "unit_id": 0, "goods_id": 945, "goods_sn": "SP0000090", "unit_name": "盒", "goods_name": "半成品/透明/奶皮卷", "total_price": 140}]	从saas.mzth.cn导入 原单号:CG0002992	0	0		0		2026-03-30 17:38:00.811226	\N
486	CG202603317717	CG202603317823	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	66.66	0.00	0.00	[{"num": 748, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 44.88}, {"num": 9, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 0.54}, {"num": 260, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 15.6}, {"num": 76, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 4.56}, {"num": 18, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 1.08}]	从saas.mzth.cn导入 原单号:CG0002016	0	0		0		2026-03-31 02:38:53.56532	\N
437	CG202603319826	CG202603319416	93	杂/采购商	牧区纯坊官方品牌	2025-12-05	107.00	0.00	0.00	[{"num": 2, "spec": "400克", "price": 3.5, "unit_id": 0, "goods_id": 929, "goods_sn": "SP0000106", "unit_name": "袋", "goods_name": "白砂糖", "total_price": 7}, {"num": 1, "spec": "1", "price": 90, "unit_id": 0, "goods_id": 1002, "goods_sn": "SP0000032", "unit_name": "台", "goods_name": "封口机/真空", "total_price": 90}, {"num": 300, "spec": "大/中/小", "price": 0.03333, "unit_id": 0, "goods_id": 928, "goods_sn": "SP0000107", "unit_name": "袋", "goods_name": "塑料购物袋", "total_price": 10}]	从saas.mzth.cn导入 原单号:CG0002864	0	0		0		2026-03-31 02:37:23.927546	\N
482	CG202603312503	CG202603314842	121	盛大印刷	牧区纯坊官方品牌	2025-09-30	970.45	0.00	0.00	[{"num": 36, "spec": "1", "price": 0.87, "unit_id": 0, "goods_id": 1032, "goods_sn": "SP0000002", "unit_name": "张", "goods_name": "专盒/冻炒米", "total_price": 31.32}, {"num": 20, "spec": "1", "price": 43.5, "unit_id": 0, "goods_id": 1032, "goods_sn": "SP0000002", "unit_name": "捆", "goods_name": "专盒/冻炒米", "total_price": 870}, {"num": 298, "spec": "1", "price": 0.05, "unit_id": 0, "goods_id": 1023, "goods_sn": "SP0000011", "unit_name": "张", "goods_name": "标签/不干胶/奶条/原味", "total_price": 14.9}, {"num": 111, "spec": "1", "price": 0.03, "unit_id": 0, "goods_id": 1020, "goods_sn": "SP0000014", "unit_name": "张", "goods_name": "标签/不干胶/奶果子", "total_price": 3.33}, {"num": 340, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1028, "goods_sn": "SP0000006", "unit_name": "张", "goods_name": "专标签/黄油", "total_price": 20.4}, {"num": 500, "spec": "1", "price": 0.06, "unit_id": 0, "goods_id": 1028, "goods_sn": "SP0000006", "unit_name": "张", "goods_name": "专标签/黄油", "total_price": 30}, {"num": 10, "spec": "1", "price": 0.05, "unit_id": 0, "goods_id": 1024, "goods_sn": "SP0000010", "unit_name": "张", "goods_name": "标签/不干胶/奶条/甜味", "total_price": 0.5}]	从saas.mzth.cn导入 原单号:CG0002020	0	0		0		2026-03-31 02:38:47.010612	\N
451	CG202603318653	CG202603314437	121	盛大印刷	牧区纯坊官方品牌	2025-11-16	594.69	0.00	0.00	[{"num": 500, "spec": "1", "price": 0.0578, "unit_id": 0, "goods_id": 1019, "goods_sn": "SP0000015", "unit_name": "张", "goods_name": "标签/不干胶/冻炒米", "total_price": 28.9}, {"num": 2000, "spec": "一张", "price": 0.181, "unit_id": 0, "goods_id": 984, "goods_sn": "SP0000050", "unit_name": "3009", "goods_name": "茶包/类腰封纸", "total_price": 362}, {"num": 500, "spec": "1", "price": 0.0816, "unit_id": 0, "goods_id": 975, "goods_sn": "SP0000059", "unit_name": "张", "goods_name": "黄油脖签", "total_price": 40.8}, {"num": 3000, "spec": "1", "price": 0.05433, "unit_id": 0, "goods_id": 978, "goods_sn": "SP0000056", "unit_name": "张", "goods_name": "新茶专用标签纸", "total_price": 162.99}]	从saas.mzth.cn导入 原单号:CG0002609	0	0		0		2026-03-31 02:37:59.038329	\N
280	CG202603306172	CG202603304952	92	奥都奶食品	牧区纯坊官方品牌	2025-12-07	240.00	0.00	0.00	[{"num": 5, "spec": "300克", "price": 8, "unit_id": 0, "goods_id": 924, "goods_sn": "SP0000111", "unit_name": "袋", "goods_name": "冻炒米/袋装", "total_price": 40}, {"num": 2, "spec": "斤", "price": 9, "unit_id": 0, "goods_id": 917, "goods_sn": "SP0000118", "unit_name": "斤", "goods_name": "机器乌日末液体", "total_price": 18}, {"num": 10, "spec": "斤", "price": 8, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 80}, {"num": 2, "spec": "半斤装", "price": 11, "unit_id": 0, "goods_id": 918, "goods_sn": "SP0000117", "unit_name": "瓶", "goods_name": "黄油/半斤", "total_price": 22}, {"num": 4, "spec": "400克", "price": 20, "unit_id": 0, "goods_id": 919, "goods_sn": "SP0000116", "unit_name": "瓶", "goods_name": "黄油/斤", "total_price": 80}]	从saas.mzth.cn导入 原单号:CG0002900	0	0		0		2026-03-30 17:38:23.742951	\N
265	CG202603306282	CG202603303668	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2025-12-14	390.00	0.00	0.00	[{"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 891, "goods_sn": "SP0000144", "unit_name": "小包", "goods_name": "芝士奶豆腐月饼", "total_price": 50}, {"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 893, "goods_sn": "SP0000142", "unit_name": "小包", "goods_name": "奶豆腐月饼", "total_price": 50}, {"num": 10, "spec": "250", "price": 4, "unit_id": 0, "goods_id": 892, "goods_sn": "SP0000143", "unit_name": "盒", "goods_name": "那牧尔酸奶", "total_price": 40}, {"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 895, "goods_sn": "SP0000140", "unit_name": "小包", "goods_name": "黄油渣月饼", "total_price": 50}, {"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 896, "goods_sn": "SP0000139", "unit_name": "小包", "goods_name": "奶皮月饼", "total_price": 50}, {"num": 10, "spec": "5", "price": 10, "unit_id": 0, "goods_id": 897, "goods_sn": "SP0000138", "unit_name": "袋", "goods_name": "早餐包/那牧尔", "total_price": 100}, {"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 894, "goods_sn": "SP0000141", "unit_name": "小包", "goods_name": "酸奶月饼", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0003017	0	0		0		2026-03-30 17:37:54.589182	\N
420	CG202603312951	CG202603319333	115	那牧尔乳制品厂/纯净之源	牧区纯坊官方品牌	2025-12-14	390.00	0.00	0.00	[{"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 891, "goods_sn": "SP0000144", "unit_name": "小包", "goods_name": "芝士奶豆腐月饼", "total_price": 50}, {"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 893, "goods_sn": "SP0000142", "unit_name": "小包", "goods_name": "奶豆腐月饼", "total_price": 50}, {"num": 10, "spec": "250", "price": 4, "unit_id": 0, "goods_id": 892, "goods_sn": "SP0000143", "unit_name": "盒", "goods_name": "那牧尔酸奶", "total_price": 40}, {"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 895, "goods_sn": "SP0000140", "unit_name": "小包", "goods_name": "黄油渣月饼", "total_price": 50}, {"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 896, "goods_sn": "SP0000139", "unit_name": "小包", "goods_name": "奶皮月饼", "total_price": 50}, {"num": 10, "spec": "5", "price": 10, "unit_id": 0, "goods_id": 897, "goods_sn": "SP0000138", "unit_name": "袋", "goods_name": "早餐包/那牧尔", "total_price": 100}, {"num": 10, "spec": "80克", "price": 5, "unit_id": 0, "goods_id": 894, "goods_sn": "SP0000141", "unit_name": "小包", "goods_name": "酸奶月饼", "total_price": 50}]	从saas.mzth.cn导入 原单号:CG0003017	0	0		0		2026-03-31 02:36:37.983958	\N
488	CG202603313713	CG202603317711	123	银河包装	牧区纯坊官方品牌	2025-09-30	6580.05	0.00	0.00	[{"num": 368, "spec": "1", "price": 0.94, "unit_id": 0, "goods_id": 1017, "goods_sn": "SP0000017", "unit_name": "张", "goods_name": "手提袋", "total_price": 345.92}, {"num": 80, "spec": "1", "price": 35.5, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "捆", "goods_name": "专袋/奶条", "total_price": 2840}, {"num": 20, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 14.2}, {"num": 86, "spec": "1", "price": 35.5, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "捆", "goods_name": "专袋/奶条", "total_price": 3053}, {"num": 5, "spec": "1", "price": 0.71, "unit_id": 0, "goods_id": 1033, "goods_sn": "SP0000001", "unit_name": "张", "goods_name": "专袋/奶条", "total_price": 3.55}, {"num": 17, "spec": "1", "price": 18.5, "unit_id": 0, "goods_id": 1031, "goods_sn": "SP0000003", "unit_name": "捆", "goods_name": "专底盒/奶条", "total_price": 314.5}, {"num": 24, "spec": "1", "price": 0.37, "unit_id": 0, "goods_id": 1031, "goods_sn": "SP0000003", "unit_name": "张", "goods_name": "专底盒/奶条", "total_price": 8.88}]	从saas.mzth.cn导入 原单号:CG0002014	0	0		0		2026-03-31 02:39:05.370707	\N
436	CG202603318627	CG202603311760	97	纯净奶食品	牧区纯坊官方品牌	2025-12-05	2805.00	0.00	0.00	[{"num": 19, "spec": "1斤2两", "price": 25, "unit_id": 0, "goods_id": 926, "goods_sn": "SP0000109", "unit_name": "个", "goods_name": "大奶豆腐砖/1.2斤", "total_price": 475}, {"num": 20, "spec": "1斤", "price": 20, "unit_id": 0, "goods_id": 927, "goods_sn": "SP0000108", "unit_name": "个", "goods_name": "小奶豆腐砖/1斤", "total_price": 400}, {"num": 20, "spec": "1斤", "price": 20, "unit_id": 0, "goods_id": 925, "goods_sn": "SP0000110", "unit_name": "个", "goods_name": "小/无印花/奶豆腐砖/1斤", "total_price": 400}, {"num": 29, "spec": "180克", "price": 14, "unit_id": 0, "goods_id": 946, "goods_sn": "SP0000089", "unit_name": "盒", "goods_name": "半成品/透明/鲜奶皮", "total_price": 406}, {"num": 6, "spec": "180克", "price": 14, "unit_id": 0, "goods_id": 945, "goods_sn": "SP0000090", "unit_name": "盒", "goods_name": "半成品/透明/奶皮卷", "total_price": 84}, {"num": 40, "spec": "200克", "price": 13, "unit_id": 0, "goods_id": 939, "goods_sn": "SP0000096", "unit_name": "盒", "goods_name": "半成品/透明/原味/鲜奶酪", "total_price": 520}, {"num": 40, "spec": "200克", "price": 13, "unit_id": 0, "goods_id": 940, "goods_sn": "SP0000095", "unit_name": "盒", "goods_name": "半成品/透明/甜味/鲜奶酪", "total_price": 520}]	从saas.mzth.cn导入 原单号:CG0002866	0	0		0		2026-03-31 02:37:21.568528	\N
295	CG202603308739	CG202603304307	100	民族印刷厂	牧区纯坊官方品牌	2025-11-16	96.00	0.00	0.00	[{"num": 25, "spec": "1", "price": 0.72, "unit_id": 0, "goods_id": 983, "goods_sn": "SP0000051", "unit_name": "张", "goods_name": "甜味/标签/不干胶/传统奶豆腐", "total_price": 18}, {"num": 25, "spec": "1", "price": 0.72, "unit_id": 0, "goods_id": 1021, "goods_sn": "SP0000013", "unit_name": "张", "goods_name": "原味/标签/不干胶/传统奶豆腐", "total_price": 18}, {"num": 60, "spec": "0", "price": 1, "unit_id": 0, "goods_id": 999, "goods_sn": "SP0000035", "unit_name": "张", "goods_name": "茶专用/不干胶/标签", "total_price": 60}]	从saas.mzth.cn导入 原单号:CG0002610	0	0		0		2026-03-30 17:38:54.588336	\N
354	CG202603318524	CG202603318635	98	科尔沁奶食品	牧区纯坊官方品牌	2026-02-23	858.00	0.00	0.00	[{"num": 5, "spec": "1斤", "price": 95, "unit_id": 0, "goods_id": 907, "goods_sn": "SP0000128", "unit_name": "袋", "goods_name": "风干牛肉500g大片", "total_price": 475}, {"num": 5, "spec": "1斤散称", "price": 15, "unit_id": 0, "goods_id": 921, "goods_sn": "SP0000114", "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "total_price": 75}, {"num": 20, "spec": "500克", "price": 5.5, "unit_id": 0, "goods_id": 932, "goods_sn": "SP0000103", "unit_name": "袋", "goods_name": "炒米海丰", "total_price": 110}, {"num": 10, "spec": "500g", "price": 4.8, "unit_id": 0, "goods_id": 931, "goods_sn": "SP0000104", "unit_name": "袋", "goods_name": "炒米粉/aag", "total_price": 48}, {"num": 10, "spec": "半斤装", "price": 15, "unit_id": 0, "goods_id": 823, "goods_sn": "SP0000213", "unit_name": "瓶", "goods_name": "黄油/中瓶", "total_price": 150}]	从saas.mzth.cn导入 原单号:CG0004429	0	0		0		2026-03-31 02:34:21.953794	\N
287	CG202603309473	CG202603308427	96	浙江金矿包装	牧区纯坊官方品牌	2025-12-04	2199.50	0.00	0.00	[{"num": 240, "spec": "7.4X7.4X7.8 奶豆腐/冻炒米通用", "price": 0.8, "unit_id": 0, "goods_id": 963, "goods_sn": "SP0000071", "unit_name": "盒", "goods_name": "小/方形/亚克力盒/", "total_price": 192}, {"num": 258, "spec": "85X85X63 鲜奶皮", "price": 0.85, "unit_id": 0, "goods_id": 962, "goods_sn": "SP0000072", "unit_name": "盒", "goods_name": "中/方形/亚克力盒/", "total_price": 219.3}, {"num": 200, "spec": "31g", "price": 0.85, "unit_id": 0, "goods_id": 960, "goods_sn": "SP0000075", "unit_name": "盒", "goods_name": "三角/奶皮千层盒", "total_price": 170}, {"num": 300, "spec": "182X120X28/烤奶豆腐片/奶皮卷", "price": 1.75, "unit_id": 0, "goods_id": 961, "goods_sn": "SP0000074", "unit_name": "盒", "goods_name": "扁盒/亚克力/带内托", "total_price": 525}, {"num": 246, "spec": "235X170X35", "price": 2.6, "unit_id": 0, "goods_id": 959, "goods_sn": "SP0000076", "unit_name": "盒", "goods_name": "大/牛薄脆盒/亚克力", "total_price": 639.6}, {"num": 183, "spec": "乳清奶条盒", "price": 1.2, "unit_id": 0, "goods_id": 958, "goods_sn": "SP0000077", "unit_name": "盒", "goods_name": "小/长方/亚克力/乳清奶条盒", "total_price": 219.6}, {"num": 180, "spec": "待包换/冻炒米 145X85X55", "price": 1.3, "unit_id": 0, "goods_id": 957, "goods_sn": "SP0000078", "unit_name": "盒", "goods_name": "大/长方/亚克力/待用", "total_price": 234}]	从saas.mzth.cn导入 原单号:CG0002853	0	0		0		2026-03-30 17:38:41.332783	\N
281	CG202603309410	CG202603308502	97	纯净奶食品	牧区纯坊官方品牌	2025-12-05	2805.00	0.00	0.00	[{"num": 19, "spec": "1斤2两", "price": 25, "unit_id": 0, "goods_id": 926, "goods_sn": "SP0000109", "unit_name": "个", "goods_name": "大奶豆腐砖/1.2斤", "total_price": 475}, {"num": 20, "spec": "1斤", "price": 20, "unit_id": 0, "goods_id": 927, "goods_sn": "SP0000108", "unit_name": "个", "goods_name": "小奶豆腐砖/1斤", "total_price": 400}, {"num": 20, "spec": "1斤", "price": 20, "unit_id": 0, "goods_id": 925, "goods_sn": "SP0000110", "unit_name": "个", "goods_name": "小/无印花/奶豆腐砖/1斤", "total_price": 400}, {"num": 29, "spec": "180克", "price": 14, "unit_id": 0, "goods_id": 946, "goods_sn": "SP0000089", "unit_name": "盒", "goods_name": "半成品/透明/鲜奶皮", "total_price": 406}, {"num": 6, "spec": "180克", "price": 14, "unit_id": 0, "goods_id": 945, "goods_sn": "SP0000090", "unit_name": "盒", "goods_name": "半成品/透明/奶皮卷", "total_price": 84}, {"num": 40, "spec": "200克", "price": 13, "unit_id": 0, "goods_id": 939, "goods_sn": "SP0000096", "unit_name": "盒", "goods_name": "半成品/透明/原味/鲜奶酪", "total_price": 520}, {"num": 40, "spec": "200克", "price": 13, "unit_id": 0, "goods_id": 940, "goods_sn": "SP0000095", "unit_name": "盒", "goods_name": "半成品/透明/甜味/鲜奶酪", "total_price": 520}]	从saas.mzth.cn导入 原单号:CG0002866	0	0		0		2026-03-30 17:38:27.659646	\N
272	CG202603302325	CG202603304349	121	盛大印刷	牧区纯坊官方品牌	2025-12-10	963.00	0.00	0.00	[{"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 900, "goods_sn": "SP0000135", "unit_name": "张", "goods_name": "透专标签/脆香奶条/微甜", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 950, "goods_sn": "SP0000085", "unit_name": "张", "goods_name": "透专标签/奶皮卷", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 951, "goods_sn": "SP0000084", "unit_name": "张", "goods_name": "透专标签/冻炒米", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 952, "goods_sn": "SP0000083", "unit_name": "张", "goods_name": "透专标签/奶酪/原味", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 953, "goods_sn": "SP0000082", "unit_name": "张", "goods_name": "透专标签/奶酪/甜味", "total_price": 160.5}, {"num": 500, "spec": "1张", "price": 0.321, "unit_id": 0, "goods_id": 956, "goods_sn": "SP0000079", "unit_name": "张", "goods_name": "透专标签/鲜奶皮", "total_price": 160.5}]	从saas.mzth.cn导入 原单号:CG0002955	0	0		0		2026-03-30 17:38:05.267114	\N
254	CG202603309411	CG202603309418	97	纯净奶食品	牧区纯坊官方品牌	2025-12-25	2310.00	0.00	0.00	[{"num": 40, "spec": "180克", "price": 14, "unit_id": 0, "goods_id": 946, "goods_sn": "SP0000089", "unit_name": "盒", "goods_name": "半成品/透明/鲜奶皮", "total_price": 560}, {"num": 50, "spec": "180克", "price": 13, "unit_id": 0, "goods_id": 945, "goods_sn": "SP0000090", "unit_name": "盒", "goods_name": "半成品/透明/奶皮卷", "total_price": 650}, {"num": 20, "spec": "150克", "price": 12, "unit_id": 0, "goods_id": 944, "goods_sn": "SP0000091", "unit_name": "盒", "goods_name": "半成品/透明/奶皮千层", "total_price": 240}, {"num": 35, "spec": "1", "price": 6, "unit_id": 0, "goods_id": 974, "goods_sn": "SP0000060", "unit_name": "瓶", "goods_name": "纯净黄油/瓶装好的", "total_price": 210}, {"num": 10, "spec": "1斤装", "price": 22, "unit_id": 0, "goods_id": 899, "goods_sn": "SP0000136", "unit_name": "瓶", "goods_name": "纯净/黄油/斤", "total_price": 220}, {"num": 4, "spec": "斤", "price": 10, "unit_id": 0, "goods_id": 920, "goods_sn": "SP0000115", "unit_name": "斤", "goods_name": "手工乌日末液体", "total_price": 40}, {"num": 30, "spec": "150-180克", "price": 13, "unit_id": 0, "goods_id": 968, "goods_sn": "SP0000066", "unit_name": "张", "goods_name": "大/奶皮", "total_price": 390}]	从saas.mzth.cn导入 原单号:CG0003286	0	0		0		2026-03-30 17:37:36.786182	\N
\.


--
-- Data for Name: retail_members; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.retail_members (id, name, mobile, gender, birthday, balance, points, level, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: retail_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.retail_orders (id, order_sn, member_id, member_name, goods_info, total_amount, pay_amount, pay_type, order_date, remark, status, created_at) FROM stdin;
22	LS20260402001	0		[{"num": 1, "price": 25, "goods_id": 3081, "unit_name": "块", "goods_name": "奶豆腐块"}]	25.00	25.00		2026-04-02		1	2026-04-02 05:08:28.90064
\.


--
-- Data for Name: retail_recharge; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.retail_recharge (id, recharge_no, member_id, member_name, amount, fund_id, fund_name, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.roles (id, name, permissions, status, created_at) FROM stdin;
\.


--
-- Data for Name: sale_contracts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_contracts (id, order_no, order_sn, customer_id, customer_name, admin_name, order_date, total_amount, pay_amount, goods_info, remark, status, created_at, deleted_at) FROM stdin;
101	XS202604021593	XS202604029357	0			\N	0.00	0.00	[]		0	2026-04-02 06:53:22.486048	2026-04-03 07:15:57.437706
102	XS202604034875	XS202604031108	21			\N	2375.50	0.00	[{"num": 16, "spec": "250克", "price": 13, "remark": "", "goods_id": 1008, "goods_sn": "SP0000026", "tax_rate": 0, "unit_name": "袋", "goods_name": "甜味奶条成品", "price_no_tax": 13}, {"num": 20, "spec": "110克", "price": 8, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 8}, {"num": 15, "spec": "240克", "price": 20, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 20}, {"num": 15, "spec": "120g/憨野", "price": 8.5, "remark": "", "goods_id": 877, "goods_sn": "SP0000158", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/奶锅巴/", "price_no_tax": 8.5}, {"num": 5, "spec": "140克", "price": 16.5, "remark": "", "goods_id": 941, "goods_sn": "SP0000094", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶酪/原味/线下", "price_no_tax": 16.5}, {"num": 5, "spec": "140克", "price": 16.5, "remark": "", "goods_id": 938, "goods_sn": "SP0000097", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶酪/甜味/线下", "price_no_tax": 16.5}, {"num": 10, "spec": "1", "price": 6, "remark": "", "goods_id": 1018, "goods_sn": "SP0000016", "tax_rate": 0, "unit_name": "张", "goods_name": "礼盒/蓝界", "price_no_tax": 6}, {"num": 120, "spec": "1", "price": 1, "remark": "", "goods_id": 1017, "goods_sn": "SP0000017", "tax_rate": 0, "unit_name": "张", "goods_name": "手提袋", "price_no_tax": 1}, {"num": 20, "spec": "1", "price": 6, "remark": "", "goods_id": 836, "goods_sn": "SP0000199", "tax_rate": 0, "unit_name": "个", "goods_name": "礼盒/2026", "price_no_tax": 6}, {"num": 10, "spec": "100克", "price": 11.5, "remark": "", "goods_id": 989, "goods_sn": "SP0000045", "tax_rate": 0, "unit_name": "瓶", "goods_name": "蒙古黄油/瓶装成品", "price_no_tax": 11.5}, {"num": 50, "spec": "16次泡", "price": 20, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 20}]	原单号:XSDD20260330001	0	2026-04-03 09:24:56.549061	\N
105	XS202604034032	XS202604036330	14			\N	58.00	0.00	[{"num": 1, "spec": "1.5kg", "price": 58, "remark": "", "goods_id": 870, "goods_sn": "SP0000165", "tax_rate": 0, "unit_name": "个", "goods_name": "大青砖茶砖", "price_no_tax": 58}]	原单号:HT0017055	0	2026-04-03 09:25:43.44086	\N
109	XS202604034400	XS202604031522	21			\N	1786.00	0.00	[{"num": 120, "spec": "120g/憨野", "price": 8.5, "remark": "", "goods_id": 877, "goods_sn": "SP0000158", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/奶锅巴/", "price_no_tax": 8.5}, {"num": 30, "spec": "120g", "price": 6.4, "remark": "", "goods_id": 876, "goods_sn": "SP0000159", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/奶条", "price_no_tax": 6.4}, {"num": 30, "spec": "140g", "price": 9.8, "remark": "", "goods_id": 875, "goods_sn": "SP0000160", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/冻炒米", "price_no_tax": 9.8}, {"num": 10, "spec": "240克", "price": 20, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 20}, {"num": 10, "spec": "110克", "price": 8, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 8}]	原单号:HT0014621	0	2026-04-03 09:25:49.898777	\N
110	XS202604037400	XS202604031112	21			\N	1034.00	0.00	[{"num": 5, "spec": "180克", "price": 9.6, "remark": "", "goods_id": 936, "goods_sn": "SP0000099", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶条/甜味/线下", "price_no_tax": 9.6}, {"num": 40, "spec": "16次泡", "price": 20, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 20}, {"num": 31, "spec": "1", "price": 6, "remark": "", "goods_id": 836, "goods_sn": "SP0000199", "tax_rate": 0, "unit_name": "个", "goods_name": "礼盒/2026", "price_no_tax": 6}]	原单号:HT0014618	0	2026-04-03 09:25:51.254363	\N
111	XS202604039193	XS202604031879	21			\N	153.00	0.00	[{"num": 18, "spec": "120g/憨野", "price": 8.5, "remark": "", "goods_id": 877, "goods_sn": "SP0000158", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/奶锅巴/", "price_no_tax": 8.5}]	原单号:HT0014616	0	2026-04-03 09:25:52.824016	\N
112	XS202604031011	XS202604035975	21			\N	160.00	0.00	[{"num": 20, "spec": "110克", "price": 8, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 8}]	原单号:HT0014615	0	2026-04-03 09:25:54.500578	\N
113	XS202604036111	XS202604034479	21			\N	1320.00	0.00	[{"num": 20, "spec": "120g/憨野", "price": 8.4, "remark": "", "goods_id": 877, "goods_sn": "SP0000158", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/奶锅巴/", "price_no_tax": 8.4}, {"num": 5, "spec": "120g", "price": 6.4, "remark": "", "goods_id": 876, "goods_sn": "SP0000159", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/奶条", "price_no_tax": 6.4}, {"num": 20, "spec": "140克", "price": 56, "remark": "", "goods_id": 874, "goods_sn": "SP0000161", "tax_rate": 0, "unit_name": "袋", "goods_name": "黄金纬度/牛肉干/成品袋", "price_no_tax": 56}]	原单号:HT0014613	0	2026-04-03 09:25:55.870101	\N
114	XS202604039876	XS202604039697	21			\N	190.40	0.00	[{"num": 20, "spec": "140g", "price": 9.4, "remark": "", "goods_id": 875, "goods_sn": "SP0000160", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/冻炒米", "price_no_tax": 9.4}, {"num": 1.2, "spec": "7.4X7.4X7.8 奶豆腐/冻炒米通用", "price": 2, "remark": "", "goods_id": 963, "goods_sn": "SP0000071", "tax_rate": 0, "unit_name": "盒", "goods_name": "小/方形/亚克力盒/", "price_no_tax": 2}]	原单号:HT0014611	0	2026-04-03 09:25:57.190386	\N
115	XS202604037978	XS202604032195	21			\N	15.50	0.00	[{"num": 1, "spec": "180克", "price": 15.5, "remark": "", "goods_id": 935, "goods_sn": "SP0000100", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶皮卷/线下", "price_no_tax": 15.5}]	原单号:HT0014610	0	2026-04-03 09:25:58.741468	\N
116	XS202604032297	XS202604038407	21			\N	400.00	0.00	[{"num": 20, "spec": "240克", "price": 20, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 20}]	原单号:HT0014609	0	2026-04-03 09:26:00.392831	\N
117	XS202604035527	XS202604035831	14			\N	1207.50	0.00	[{"num": 2.5, "spec": "1", "price": 25, "remark": "", "goods_id": 885, "goods_sn": "SP0000150", "tax_rate": 0, "unit_name": "斤", "goods_name": "冻炒米/散装", "price_no_tax": 25}, {"num": 5, "spec": "4颗/350克", "price": 15, "remark": "", "goods_id": 880, "goods_sn": "SP0000155", "tax_rate": 0, "unit_name": "袋", "goods_name": "阿润月饼/五仁馅", "price_no_tax": 15}, {"num": 5, "spec": "4颗/350克", "price": 15, "remark": "", "goods_id": 882, "goods_sn": "SP0000153", "tax_rate": 0, "unit_name": "袋", "goods_name": "阿润月饼/黄油渣馅", "price_no_tax": 15}, {"num": 6, "spec": "1斤装", "price": 35, "remark": "", "goods_id": 899, "goods_sn": "SP0000136", "tax_rate": 0, "unit_name": "瓶", "goods_name": "纯净/黄油/斤", "price_no_tax": 35}, {"num": 4, "spec": "400克", "price": 30, "remark": "", "goods_id": 919, "goods_sn": "SP0000116", "tax_rate": 0, "unit_name": "瓶", "goods_name": "黄油/斤", "price_no_tax": 30}, {"num": 1, "spec": "1", "price": 0, "remark": "", "goods_id": 836, "goods_sn": "SP0000199", "tax_rate": 0, "unit_name": "个", "goods_name": "礼盒/2026", "price_no_tax": 0}, {"num": 15, "spec": "1", "price": 0, "remark": "", "goods_id": 850, "goods_sn": "SP0000185", "tax_rate": 0, "unit_name": "张", "goods_name": "红糖袋/delicious", "price_no_tax": 0}, {"num": 5, "spec": "散装", "price": 50, "remark": "", "goods_id": 835, "goods_sn": "SP0000200", "tax_rate": 0, "unit_name": "散", "goods_name": "奶果子/小包装/成品", "price_no_tax": 50}, {"num": 5, "spec": "16次泡", "price": 58, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 58}, {"num": 5, "spec": "1斤散称", "price": 25, "remark": "", "goods_id": 921, "goods_sn": "SP0000114", "tax_rate": 0, "unit_name": "斤", "goods_name": "嚼口脆炒米糖/散装", "price_no_tax": 25}]	原单号:HT0014457	0	2026-04-03 09:26:01.872564	\N
123	XS202604036322	XS202604037734	21			\N	1254.80	0.00	[{"num": 26, "spec": "240克", "price": 20, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 20}, {"num": 10, "spec": "100克", "price": 11.5, "remark": "", "goods_id": 989, "goods_sn": "SP0000045", "tax_rate": 0, "unit_name": "瓶", "goods_name": "蒙古黄油/瓶装成品", "price_no_tax": 11.5}, {"num": 44, "spec": "110克", "price": 8, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 8}, {"num": 30, "spec": "120g/憨野", "price": 8.5, "remark": "", "goods_id": 877, "goods_sn": "SP0000158", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/奶锅巴/", "price_no_tax": 8.5}, {"num": 2, "spec": "120g", "price": 6.4, "remark": "", "goods_id": 876, "goods_sn": "SP0000159", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/奶条", "price_no_tax": 6.4}]	原单号:HT0012192	0	2026-04-03 09:26:10.949943	\N
125	XS202604037293	XS202604035786	3			\N	584.00	0.00	[{"num": 10, "spec": "5g/袋泡茶/30泡", "price": 14, "remark": "", "goods_id": 867, "goods_sn": "SP0000168", "tax_rate": 0, "unit_name": "盒", "goods_name": "5g/青砖袋泡茶", "price_no_tax": 14}, {"num": 13, "spec": "450g/25袋", "price": 12, "remark": "", "goods_id": 868, "goods_sn": "SP0000167", "tax_rate": 0, "unit_name": "袋", "goods_name": "16g青砖袋泡茶", "price_no_tax": 12}, {"num": 12, "spec": "16次泡", "price": 24, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 24}]	原单号:HT0012162	0	2026-04-03 09:26:14.558393	\N
129	XS202604038522	XS202604036769	21			\N	220.00	0.00	[{"num": 3, "spec": "16次泡", "price": 20, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 20}, {"num": 20, "spec": "110克", "price": 8, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 8}]	原单号:HT0011474	0	2026-04-03 09:26:20.638697	\N
132	XS202604038710	XS202604031953	12			\N	308.84	0.00	[{"num": 7, "spec": "16次泡", "price": 44.12, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 44.12}]	原单号:HT0011469	0	2026-04-03 09:26:25.264709	\N
135	XS202604036738	XS202604038153	21			\N	397.90	0.00	[{"num": 10, "spec": "110克", "price": 8, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 8}, {"num": 4, "spec": "140克", "price": 9.8, "remark": "", "goods_id": 964, "goods_sn": "SP0000070", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/冻炒米/线下", "price_no_tax": 9.8}, {"num": 2, "spec": "180克", "price": 16.6, "remark": "", "goods_id": 937, "goods_sn": "SP0000098", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶皮/线下", "price_no_tax": 16.6}, {"num": 3, "spec": "180克", "price": 16.5, "remark": "", "goods_id": 935, "goods_sn": "SP0000100", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶皮卷/线下", "price_no_tax": 16.5}, {"num": 2, "spec": "180克", "price": 15.5, "remark": "", "goods_id": 934, "goods_sn": "SP0000101", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶皮千层/线下", "price_no_tax": 15.5}, {"num": 5, "spec": "140克", "price": 16.5, "remark": "", "goods_id": 938, "goods_sn": "SP0000097", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶酪/甜味/线下", "price_no_tax": 16.5}, {"num": 5, "spec": "140克", "price": 16.5, "remark": "", "goods_id": 941, "goods_sn": "SP0000094", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶酪/原味/线下", "price_no_tax": 16.5}]	原单号:HT0010634	0	2026-04-03 09:26:30.054265	\N
141	XS202604032995	XS202604036437	21			\N	66.00	0.00	[{"num": 4, "spec": "140克", "price": 16.5, "remark": "", "goods_id": 938, "goods_sn": "SP0000097", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶酪/甜味/线下", "price_no_tax": 16.5}]	原单号:HT0010619	0	2026-04-03 09:26:39.064769	\N
142	XS202604036342	XS202604032645	12			\N	38.90	0.00	[{"num": 1, "spec": "16次泡", "price": 38.9, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 38.9}]	原单号:HT0010328	0	2026-04-03 09:26:40.635766	\N
146	XS202604032851	XS202604034225	21			\N	412.00	0.00	[{"num": 10, "spec": "180克", "price": 9.50495, "remark": "", "goods_id": 936, "goods_sn": "SP0000099", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶条/甜味/线下", "price_no_tax": 9.50495}, {"num": 3, "spec": "140克", "price": 16.33663, "remark": "", "goods_id": 941, "goods_sn": "SP0000094", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶酪/原味/线下", "price_no_tax": 16.33663}, {"num": 5, "spec": "140克", "price": 16.33663, "remark": "", "goods_id": 938, "goods_sn": "SP0000097", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶酪/甜味/线下", "price_no_tax": 16.33663}, {"num": 2, "spec": "1斤2两", "price": 29.70297, "remark": "", "goods_id": 926, "goods_sn": "SP0000109", "tax_rate": 0, "unit_name": "个", "goods_name": "大奶豆腐砖/1.2斤", "price_no_tax": 29.70297}, {"num": 2, "spec": "1斤", "price": 24.75248, "remark": "", "goods_id": 927, "goods_sn": "SP0000108", "tax_rate": 0, "unit_name": "个", "goods_name": "小奶豆腐砖/1斤", "price_no_tax": 24.75248}, {"num": 2, "spec": "250克", "price": 9.90099, "remark": "", "goods_id": 915, "goods_sn": "SP0000120", "tax_rate": 0, "unit_name": "盒", "goods_name": "黄油渣/盒", "price_no_tax": 9.90099}, {"num": 1, "spec": "300克", "price": 9.90099, "remark": "", "goods_id": 924, "goods_sn": "SP0000111", "tax_rate": 0, "unit_name": "袋", "goods_name": "冻炒米/袋装", "price_no_tax": 9.90099}, {"num": 1, "spec": "斤", "price": 10.89109, "remark": "", "goods_id": 917, "goods_sn": "SP0000118", "tax_rate": 0, "unit_name": "斤", "goods_name": "机器乌日末液体", "price_no_tax": 10.89109}, {"num": 2, "spec": "180克", "price": 16.33663, "remark": "", "goods_id": 935, "goods_sn": "SP0000100", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶皮卷/线下", "price_no_tax": 16.33663}]	原单号:HT0009453	0	2026-04-03 09:26:46.842003	\N
154	XS202604036857	XS202604035674	14			\N	70.38	0.00	[{"num": 3, "spec": "150-180克", "price": 15, "remark": "", "goods_id": 968, "goods_sn": "SP0000066", "tax_rate": 0, "unit_name": "张", "goods_name": "大/奶皮", "price_no_tax": 15}, {"num": 1.095, "spec": "斤/两盒", "price": 23.17808, "remark": "", "goods_id": 981, "goods_sn": "SP0000053", "tax_rate": 0, "unit_name": "斤", "goods_name": "烤奶皮", "price_no_tax": 23.17808}]	原单号:HT0008537	0	2026-04-03 09:26:59.73883	\N
155	XS202604037765	XS202604031025	21			\N	170.00	0.00	[{"num": 10, "spec": "250克", "price": 12.87129, "remark": "", "goods_id": 1008, "goods_sn": "SP0000026", "tax_rate": 0, "unit_name": "袋", "goods_name": "甜味奶条成品", "price_no_tax": 12.87129}, {"num": 2, "spec": "240克", "price": 19.80198, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 19.80198}]	原单号:HT0008532	0	2026-04-03 09:27:01.09444	\N
170	XS202604033259	XS202604037042	6			\N	153.60	0.00	[{"num": 3, "spec": "240克", "price": 48, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 48}, {"num": 1, "spec": "240克", "price": 48, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 48}]	原单号:HT0006752	0	2026-04-03 09:27:23.916859	\N
158	XS202604039386	XS202604038931	10			\N	110.00	0.00	[{"num": 2, "spec": "240克", "price": 55, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 55}]	原单号:HT0008400	0	2026-04-03 09:27:05.517976	\N
159	XS202604035522	XS202604033859	10			\N	42.00	0.00	[{"num": 1, "spec": "100克", "price": 42, "remark": "", "goods_id": 989, "goods_sn": "SP0000045", "tax_rate": 0, "unit_name": "瓶", "goods_name": "蒙古黄油/瓶装成品", "price_no_tax": 42}]	原单号:HT0008399	0	2026-04-03 09:27:06.819737	\N
172	XS202604038848	XS202604032089	11			\N	169.80	0.00	[{"num": 3, "spec": "110克", "price": 18.33333, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 18.33333}, {"num": 2, "spec": "250克", "price": 28.7, "remark": "", "goods_id": 1007, "goods_sn": "SP0000027", "tax_rate": 0, "unit_name": "袋", "goods_name": "原味奶条成品", "price_no_tax": 28.7}, {"num": 2, "spec": "250克", "price": 28.7, "remark": "", "goods_id": 1008, "goods_sn": "SP0000026", "tax_rate": 0, "unit_name": "袋", "goods_name": "甜味奶条成品", "price_no_tax": 28.7}]	原单号:HT0006750	0	2026-04-03 09:27:26.728816	\N
103	XS202604035687	XS202604032278	21			\N	2375.50	0.00	[{"num": 16, "spec": "250克", "price": 13, "remark": "", "goods_id": 1008, "goods_sn": "SP0000026", "tax_rate": 0, "unit_name": "袋", "goods_name": "甜味奶条成品", "price_no_tax": 13}, {"num": 20, "spec": "110克", "price": 8, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 8}, {"num": 15, "spec": "240克", "price": 20, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 20}, {"num": 15, "spec": "120g/憨野", "price": 8.5, "remark": "", "goods_id": 877, "goods_sn": "SP0000158", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/奶锅巴/", "price_no_tax": 8.5}, {"num": 5, "spec": "140克", "price": 16.5, "remark": "", "goods_id": 941, "goods_sn": "SP0000094", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶酪/原味/线下", "price_no_tax": 16.5}, {"num": 5, "spec": "140克", "price": 16.5, "remark": "", "goods_id": 938, "goods_sn": "SP0000097", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶酪/甜味/线下", "price_no_tax": 16.5}, {"num": 10, "spec": "1", "price": 6, "remark": "", "goods_id": 1018, "goods_sn": "SP0000016", "tax_rate": 0, "unit_name": "张", "goods_name": "礼盒/蓝界", "price_no_tax": 6}, {"num": 120, "spec": "1", "price": 1, "remark": "", "goods_id": 1017, "goods_sn": "SP0000017", "tax_rate": 0, "unit_name": "张", "goods_name": "手提袋", "price_no_tax": 1}, {"num": 20, "spec": "1", "price": 6, "remark": "", "goods_id": 836, "goods_sn": "SP0000199", "tax_rate": 0, "unit_name": "个", "goods_name": "礼盒/2026", "price_no_tax": 6}, {"num": 10, "spec": "100克", "price": 11.5, "remark": "", "goods_id": 989, "goods_sn": "SP0000045", "tax_rate": 0, "unit_name": "瓶", "goods_name": "蒙古黄油/瓶装成品", "price_no_tax": 11.5}, {"num": 50, "spec": "16次泡", "price": 20, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 20}]	原单号:XSDD20260330001	0	2026-04-03 09:25:40.478611	\N
160	XS202604038542	XS202604037021	6			\N	76.80	0.00	[{"num": 2, "spec": "16次泡", "price": 48, "remark": "", "goods_id": 996, "goods_sn": "SP0000038", "tax_rate": 0, "unit_name": "盒", "goods_name": "青砖奶茶成品", "price_no_tax": 48}]	原单号:HT0007755	0	2026-04-03 09:27:08.132289	\N
178	XS202604032074	XS202604032873	56			\N	4260.00	0.00	[{"num": 120, "spec": "180克", "price": 19, "remark": "", "goods_id": 935, "goods_sn": "SP0000100", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶皮卷/线下", "price_no_tax": 19}, {"num": 30, "spec": "180克", "price": 18, "remark": "", "goods_id": 937, "goods_sn": "SP0000098", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶皮/线下", "price_no_tax": 18}, {"num": 80, "spec": "180克", "price": 18, "remark": "", "goods_id": 934, "goods_sn": "SP0000101", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶皮千层/线下", "price_no_tax": 18}]	原单号:HT0014625	0	2026-04-03 09:28:46.558694	\N
104	XS202604033071	XS202604036958	14			\N	859.50	0.00	[{"num": 5, "spec": "45散称/斤/9元/100克", "price": 58, "remark": "", "goods_id": 972, "goods_sn": "SP0000062", "tax_rate": 0, "unit_name": "斤", "goods_name": "原味/散称/奶豆腐块儿", "price_no_tax": 58}, {"num": 1, "spec": "1.5kg", "price": 58, "remark": "", "goods_id": 870, "goods_sn": "SP0000165", "tax_rate": 0, "unit_name": "个", "goods_name": "大青砖茶砖", "price_no_tax": 58}, {"num": 5, "spec": "140克", "price": 23.5, "remark": "", "goods_id": 964, "goods_sn": "SP0000070", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/冻炒米/线下", "price_no_tax": 23.5}, {"num": 5, "spec": "180克", "price": 22, "remark": "", "goods_id": 933, "goods_sn": "SP0000102", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶条/原味/线下", "price_no_tax": 22}, {"num": 3, "spec": "1", "price": 48, "remark": "", "goods_id": 974, "goods_sn": "SP0000060", "tax_rate": 0, "unit_name": "瓶", "goods_name": "纯净黄油/瓶装好的", "price_no_tax": 48}, {"num": 2, "spec": "45散称/斤/9元/100克", "price": 70, "remark": "", "goods_id": 971, "goods_sn": "SP0000063", "tax_rate": 0, "unit_name": "斤", "goods_name": "甜味/散称/奶豆腐块儿", "price_no_tax": 70}]	原单号:HT0017059	0	2026-04-03 09:25:42.105747	\N
106	XS202604031583	XS202604032388	55			\N	276.20	0.00	[{"num": 3, "spec": "180克", "price": 26.6, "remark": "", "goods_id": 935, "goods_sn": "SP0000100", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶皮卷/线下", "price_no_tax": 26.6}, {"num": 3, "spec": "180克", "price": 29.8, "remark": "", "goods_id": 937, "goods_sn": "SP0000098", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶皮/线下", "price_no_tax": 29.8}, {"num": 2, "spec": "140g", "price": 23.5, "remark": "", "goods_id": 875, "goods_sn": "SP0000160", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/冻炒米", "price_no_tax": 23.5}, {"num": 3, "spec": "150克", "price": 20, "remark": "", "goods_id": 986, "goods_sn": "SP0000048", "tax_rate": 0, "unit_name": "袋", "goods_name": "精品/奶豆腐块儿/原味", "price_no_tax": 20}]	原单号:HT0017054	0	2026-04-03 09:25:44.781107	\N
107	XS202604031211	XS202604035572	55			\N	1780.00	0.00	[{"num": 3, "spec": "16次泡", "price": 50, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 50}, {"num": 3, "spec": "110克", "price": 30, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 30}, {"num": 3, "spec": "240克", "price": 50, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 50}, {"num": 5, "spec": "180克", "price": 22, "remark": "", "goods_id": 937, "goods_sn": "SP0000098", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶皮/线下", "price_no_tax": 22}, {"num": 10, "spec": "180克", "price": 22, "remark": "", "goods_id": 934, "goods_sn": "SP0000101", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶皮千层/线下", "price_no_tax": 22}, {"num": 5, "spec": "140克", "price": 23.5, "remark": "", "goods_id": 938, "goods_sn": "SP0000097", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶酪/甜味/线下", "price_no_tax": 23.5}, {"num": 5, "spec": "140克", "price": 23.5, "remark": "", "goods_id": 941, "goods_sn": "SP0000094", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶酪/原味/线下", "price_no_tax": 23.5}, {"num": 5, "spec": "140克", "price": 19, "remark": "", "goods_id": 964, "goods_sn": "SP0000070", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/冻炒米/线下", "price_no_tax": 19}, {"num": 5, "spec": "180克", "price": 16, "remark": "", "goods_id": 933, "goods_sn": "SP0000102", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶条/原味/线下", "price_no_tax": 16}, {"num": 5, "spec": "180克", "price": 16, "remark": "", "goods_id": 936, "goods_sn": "SP0000099", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶条/甜味/线下", "price_no_tax": 16}, {"num": 5, "spec": "200克", "price": 22, "remark": "", "goods_id": 827, "goods_sn": "SP0000209", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶锅巴/线下", "price_no_tax": 22}, {"num": 20, "spec": "180克", "price": 23, "remark": "", "goods_id": 935, "goods_sn": "SP0000100", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶皮卷/线下", "price_no_tax": 23}]	原单号:HT0015545	0	2026-04-03 09:25:46.56649	\N
108	XS202604039763	XS202604034787	21			\N	124.50	0.00	[{"num": 5, "spec": "180克", "price": 9.6, "remark": "", "goods_id": 936, "goods_sn": "SP0000099", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶条/甜味/线下", "price_no_tax": 9.6}, {"num": 9, "spec": "120g/憨野", "price": 8.5, "remark": "", "goods_id": 877, "goods_sn": "SP0000158", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/奶锅巴/", "price_no_tax": 8.5}]	原单号:HT0014663	0	2026-04-03 09:25:48.225657	\N
118	XS202604032941	XS202604038870	15			\N	129.00	0.00	[{"num": 5, "spec": "1", "price": 8, "remark": "", "goods_id": 836, "goods_sn": "SP0000199", "tax_rate": 0, "unit_name": "个", "goods_name": "礼盒/2026", "price_no_tax": 8}, {"num": 5, "spec": "1", "price": 1, "remark": "", "goods_id": 864, "goods_sn": "SP0000171", "tax_rate": 0, "unit_name": "张", "goods_name": "礼盒/腰封", "price_no_tax": 1}, {"num": 5, "spec": "1", "price": 8, "remark": "", "goods_id": 1018, "goods_sn": "SP0000016", "tax_rate": 0, "unit_name": "张", "goods_name": "礼盒/蓝界", "price_no_tax": 8}, {"num": 5, "spec": "待包换/冻炒米 145X85X55", "price": 2.8, "remark": "", "goods_id": 957, "goods_sn": "SP0000078", "tax_rate": 0, "unit_name": "盒", "goods_name": "大/长方/亚克力/待用", "price_no_tax": 2.8}, {"num": 5, "spec": "235X170X35", "price": 3, "remark": "", "goods_id": 959, "goods_sn": "SP0000076", "tax_rate": 0, "unit_name": "盒", "goods_name": "大/牛薄脆盒/亚克力", "price_no_tax": 3}, {"num": 5, "spec": "1张", "price": 1, "remark": "", "goods_id": 900, "goods_sn": "SP0000135", "tax_rate": 0, "unit_name": "张", "goods_name": "透专标签/脆香奶条/微甜", "price_no_tax": 1}, {"num": 5, "spec": "1张", "price": 1, "remark": "", "goods_id": 953, "goods_sn": "SP0000082", "tax_rate": 0, "unit_name": "张", "goods_name": "透专标签/奶酪/甜味", "price_no_tax": 1}, {"num": 5, "spec": "1张", "price": 1, "remark": "", "goods_id": 954, "goods_sn": "SP0000081", "tax_rate": 0, "unit_name": "张", "goods_name": "透专标签/乳清奶条/甜味", "price_no_tax": 1}]	原单号:HT0014087	0	2026-04-03 09:26:03.50964	\N
119	XS202604039522	XS202604035886	18			\N	600.00	0.00	[{"num": 30, "spec": "16次泡", "price": 20, "remark": "", "goods_id": 996, "goods_sn": "SP0000038", "tax_rate": 0, "unit_name": "盒", "goods_name": "青砖奶茶成品", "price_no_tax": 20}]	原单号:HT0012750	0	2026-04-03 09:26:05.06541	\N
120	XS202604035418	XS202604036522	21			\N	1440.00	0.00	[{"num": 30, "spec": "240克", "price": 20, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 20}, {"num": 30, "spec": "110克", "price": 8, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 8}, {"num": 30, "spec": "16次泡", "price": 20, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 20}]	原单号:HT0012195	0	2026-04-03 09:26:06.63186	\N
121	XS202604035596	XS202604034896	21			\N	99.80	0.00	[{"num": 10, "spec": "140g", "price": 9.8, "remark": "", "goods_id": 875, "goods_sn": "SP0000160", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/冻炒米", "price_no_tax": 9.8}, {"num": 1, "spec": "乳清奶条盒", "price": 1.8, "remark": "", "goods_id": 958, "goods_sn": "SP0000077", "tax_rate": 0, "unit_name": "盒", "goods_name": "小/长方/亚克力/乳清奶条盒", "price_no_tax": 1.8}]	原单号:HT0012194	0	2026-04-03 09:26:07.963851	\N
122	XS202604033266	XS202604037680	21			\N	93.40	0.00	[{"num": 3, "spec": "140g", "price": 9.8, "remark": "", "goods_id": 875, "goods_sn": "SP0000160", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/冻炒米", "price_no_tax": 9.8}, {"num": 10, "spec": "120g", "price": 6.4, "remark": "", "goods_id": 876, "goods_sn": "SP0000159", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/奶条", "price_no_tax": 6.4}]	原单号:HT0012193	0	2026-04-03 09:26:09.345766	\N
124	XS202604033284	XS202604035835	21			\N	845.80	0.00	[{"num": 11, "spec": "250克", "price": 13, "remark": "", "goods_id": 1008, "goods_sn": "SP0000026", "tax_rate": 0, "unit_name": "袋", "goods_name": "甜味奶条成品", "price_no_tax": 13}, {"num": 19, "spec": "250克", "price": 14, "remark": "", "goods_id": 1007, "goods_sn": "SP0000027", "tax_rate": 0, "unit_name": "袋", "goods_name": "原味奶条成品", "price_no_tax": 14}, {"num": 6, "spec": "240克", "price": 20, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 20}, {"num": 6, "spec": "110克", "price": 8, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 8}, {"num": 32, "spec": "120g/憨野", "price": 8.4, "remark": "", "goods_id": 877, "goods_sn": "SP0000158", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/奶锅巴/", "price_no_tax": 8.4}]	原单号:HT0012191	0	2026-04-03 09:26:13.180166	\N
126	XS202604037822	XS202604032888	5			\N	2700.00	0.00	[{"num": 100, "spec": "16次泡", "price": 26.73267, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 26.73267}]	原单号:HT0011634	0	2026-04-03 09:26:16.332177	\N
127	XS202604037867	XS202604033676	10			\N	110.00	0.00	[{"num": 2, "spec": "240克", "price": 55, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 55}]	原单号:HT0011476	0	2026-04-03 09:26:17.90468	\N
128	XS202604032365	XS202604039814	21			\N	564.60	0.00	[{"num": 30, "spec": "180克", "price": 16.6, "remark": "", "goods_id": 937, "goods_sn": "SP0000098", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶皮/线下", "price_no_tax": 16.6}, {"num": 1, "spec": "140g", "price": 9.4, "remark": "", "goods_id": 875, "goods_sn": "SP0000160", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/冻炒米", "price_no_tax": 9.4}, {"num": 4, "spec": "120g/憨野", "price": 8.4, "remark": "", "goods_id": 877, "goods_sn": "SP0000158", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/奶锅巴/", "price_no_tax": 8.4}, {"num": 50, "spec": "1", "price": 0.4, "remark": "", "goods_id": 864, "goods_sn": "SP0000171", "tax_rate": 0, "unit_name": "张", "goods_name": "礼盒/腰封", "price_no_tax": 0.4}, {"num": 3, "spec": "7.4X7.4X7.8 奶豆腐/冻炒米通用", "price": 1.2, "remark": "", "goods_id": 963, "goods_sn": "SP0000071", "tax_rate": 0, "unit_name": "盒", "goods_name": "小/方形/亚克力盒/", "price_no_tax": 1.2}]	原单号:HT0011475	0	2026-04-03 09:26:19.295511	\N
130	XS202604038307	XS202604033961	21			\N	1333.00	0.00	[{"num": 7, "spec": "120g", "price": 6.4, "remark": "", "goods_id": 876, "goods_sn": "SP0000159", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/奶条", "price_no_tax": 6.4}, {"num": 3, "spec": "140g", "price": 9.4, "remark": "", "goods_id": 875, "goods_sn": "SP0000160", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/冻炒米", "price_no_tax": 9.4}, {"num": 20, "spec": "110克", "price": 8, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 8}, {"num": 55, "spec": "16次泡", "price": 20, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 20}]	原单号:HT0011473	0	2026-04-03 09:26:22.242005	\N
131	XS202604033418	XS202604031208	21			\N	715.00	0.00	[{"num": 10, "spec": "5g/袋泡茶/30泡", "price": 12, "remark": "", "goods_id": 867, "goods_sn": "SP0000168", "tax_rate": 0, "unit_name": "盒", "goods_name": "5g/青砖袋泡茶", "price_no_tax": 12}, {"num": 10, "spec": "380g", "price": 9.5, "remark": "", "goods_id": 871, "goods_sn": "SP0000164", "tax_rate": 0, "unit_name": "个", "goods_name": "小青砖茶砖", "price_no_tax": 9.5}, {"num": 20, "spec": "16次泡", "price": 20, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 20}, {"num": 60, "spec": "140克", "price": 0, "remark": "", "goods_id": 873, "goods_sn": "SP0000162", "tax_rate": 0, "unit_name": "袋", "goods_name": "专袋/牛肉干包装", "price_no_tax": 0}, {"num": 10, "spec": "450g", "price": 10, "remark": "", "goods_id": 869, "goods_sn": "SP0000166", "tax_rate": 0, "unit_name": "袋", "goods_name": "青砖碎茶", "price_no_tax": 10}]	原单号:HT0011472	0	2026-04-03 09:26:23.842168	\N
133	XS202604036492	XS202604032530	13			\N	390.00	0.00	[{"num": 13, "spec": "16次泡", "price": 30, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 30}]	原单号:HT0011468	0	2026-04-03 09:26:26.622518	\N
134	XS202604032415	XS202604036385	13			\N	30.00	0.00	[{"num": 1, "spec": "16次泡", "price": 30, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 30}]	原单号:HT0010640	0	2026-04-03 09:26:28.324282	\N
161	XS202604038186	XS202604039453	21			\N	1566.00	0.00	[{"num": 528, "spec": "400/箱/0.423/球", "price": 0.4225, "remark": "换货单", "goods_id": 1010, "goods_sn": "SP0000024", "tax_rate": 0, "unit_name": "个", "goods_name": "奶油球", "price_no_tax": 0.4225}, {"num": 63, "spec": "1", "price": 0.87, "remark": "换货单", "goods_id": 1032, "goods_sn": "SP0000002", "tax_rate": 0, "unit_name": "张", "goods_name": "专盒/冻炒米", "price_no_tax": 0.87}, {"num": 30, "spec": "1", "price": 0.37, "remark": "换货单", "goods_id": 1031, "goods_sn": "SP0000003", "tax_rate": 0, "unit_name": "张", "goods_name": "专底盒/奶条", "price_no_tax": 0.37}, {"num": 30, "spec": "1", "price": 0.71, "remark": "换货单", "goods_id": 1033, "goods_sn": "SP0000001", "tax_rate": 0, "unit_name": "张", "goods_name": "专袋/奶条", "price_no_tax": 0.71}, {"num": 30, "spec": "1", "price": 0.05, "remark": "换货单", "goods_id": 1024, "goods_sn": "SP0000010", "tax_rate": 0, "unit_name": "张", "goods_name": "标签/不干胶/奶条/甜味", "price_no_tax": 0.05}, {"num": 43, "spec": "1", "price": 17, "remark": "", "goods_id": 976, "goods_sn": "SP0000058", "tax_rate": 0, "unit_name": "盒", "goods_name": "暂用/茶 新旧更替", "price_no_tax": 17}, {"num": 20, "spec": "240克", "price": 20, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 20}, {"num": 15, "spec": "110克", "price": 7.5, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 7.5}, {"num": 2, "spec": "斤/两盒", "price": 23, "remark": "", "goods_id": 981, "goods_sn": "SP0000053", "tax_rate": 0, "unit_name": "盒", "goods_name": "烤奶皮", "price_no_tax": 23}, {"num": 63, "spec": "1", "price": 0.1, "remark": "换货单", "goods_id": 993, "goods_sn": "SP0000041", "tax_rate": 0, "unit_name": "张", "goods_name": "冻炒米专用/塑膜袋", "price_no_tax": 0.1}, {"num": 8, "spec": "1", "price": 0.1, "remark": "换货单", "goods_id": 990, "goods_sn": "SP0000044", "tax_rate": 0, "unit_name": "袋", "goods_name": "奶果子/专用塑膜袋", "price_no_tax": 0.1}, {"num": 8, "spec": "1", "price": 0.03, "remark": "换货单", "goods_id": 1020, "goods_sn": "SP0000014", "tax_rate": 0, "unit_name": "张", "goods_name": "标签/不干胶/奶果子", "price_no_tax": 0.03}, {"num": 8, "spec": "1", "price": 0.65, "remark": "换货单", "goods_id": 1030, "goods_sn": "SP0000004", "tax_rate": 0, "unit_name": "张", "goods_name": "专外盒/奶果子", "price_no_tax": 0.65}, {"num": 33, "spec": "0", "price": 0, "remark": "", "goods_id": 995, "goods_sn": "SP0000039", "tax_rate": 0, "unit_name": "袋", "goods_name": "茶专用/热缩膜", "price_no_tax": 0}, {"num": 33, "spec": "0", "price": 0, "remark": "", "goods_id": 999, "goods_sn": "SP0000035", "tax_rate": 0, "unit_name": "张", "goods_name": "茶专用/不干胶/标签", "price_no_tax": 0}]	原单号:HT0007754 | 成本总价 105.47 *2=52.735	0	2026-04-03 09:27:09.921301	\N
143	XS202604032224	XS202604038006	21			\N	248.20	0.00	[{"num": 5, "spec": "240克", "price": 20, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 20}, {"num": 5, "spec": "140克", "price": 9.8, "remark": "", "goods_id": 964, "goods_sn": "SP0000070", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/冻炒米/线下", "price_no_tax": 9.8}, {"num": 2, "spec": "180克", "price": 16.6, "remark": "", "goods_id": 937, "goods_sn": "SP0000098", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶皮/线下", "price_no_tax": 16.6}, {"num": 2, "spec": "140克", "price": 16.5, "remark": "", "goods_id": 938, "goods_sn": "SP0000097", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶酪/甜味/线下", "price_no_tax": 16.5}, {"num": 2, "spec": "140克", "price": 16.5, "remark": "", "goods_id": 941, "goods_sn": "SP0000094", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶酪/原味/线下", "price_no_tax": 16.5}]	原单号:HT0009458	0	2026-04-03 09:26:42.293929	\N
167	XS202604033346	XS202604037950	12			\N	98.60	0.00	[{"num": 1, "spec": "250克", "price": 49.3, "remark": "", "goods_id": 1007, "goods_sn": "SP0000027", "tax_rate": 0, "unit_name": "袋", "goods_name": "原味奶条成品", "price_no_tax": 49.3}, {"num": 1, "spec": "250克", "price": 49.3, "remark": "", "goods_id": 1008, "goods_sn": "SP0000026", "tax_rate": 0, "unit_name": "袋", "goods_name": "甜味奶条成品", "price_no_tax": 49.3}]	原单号:HT0007037	0	2026-04-03 09:27:18.92168	\N
168	XS202604039543	XS202604033389	10			\N	90.00	0.00	[{"num": 2, "spec": "240克", "price": 45, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 45}]	原单号:HT0007036	0	2026-04-03 09:27:20.799176	\N
169	XS202604037603	XS202604039718	21			\N	1700.00	0.00	[{"num": 100, "spec": "16次泡", "price": 17, "remark": "", "goods_id": 996, "goods_sn": "SP0000038", "tax_rate": 0, "unit_name": "盒", "goods_name": "青砖奶茶成品", "price_no_tax": 17}]	原单号:HT0007030	0	2026-04-03 09:27:22.335435	\N
136	XS202604032480	XS202604038473	21			\N	1244.10	0.00	[{"num": 25, "spec": "180克", "price": 16.5, "remark": "", "goods_id": 935, "goods_sn": "SP0000100", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶皮卷/线下", "price_no_tax": 16.5}, {"num": 12, "spec": "180克", "price": 15.5, "remark": "", "goods_id": 934, "goods_sn": "SP0000101", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶皮千层/线下", "price_no_tax": 15.5}, {"num": 15, "spec": "180克", "price": 16.6, "remark": "", "goods_id": 937, "goods_sn": "SP0000098", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶皮/线下", "price_no_tax": 16.6}, {"num": 20, "spec": "140g", "price": 9.4, "remark": "", "goods_id": 875, "goods_sn": "SP0000160", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/冻炒米", "price_no_tax": 9.4}, {"num": 20, "spec": "120g", "price": 6.4, "remark": "", "goods_id": 876, "goods_sn": "SP0000159", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/奶条", "price_no_tax": 6.4}, {"num": 20, "spec": "120g/憨野", "price": 2.88, "remark": "", "goods_id": 877, "goods_sn": "SP0000158", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/奶锅巴/", "price_no_tax": 2.88}, {"num": 1, "spec": "斤/两盒", "price": 23, "remark": "", "goods_id": 981, "goods_sn": "SP0000053", "tax_rate": 0, "unit_name": "盒", "goods_name": "烤奶皮", "price_no_tax": 23}]	原单号:HT0010633	0	2026-04-03 09:26:31.47909	\N
137	XS202604039473	XS202604039703	21			\N	31.60	0.00	[{"num": 1, "spec": "120g", "price": 6.4, "remark": "", "goods_id": 876, "goods_sn": "SP0000159", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/奶条", "price_no_tax": 6.4}, {"num": 3, "spec": "120g/憨野", "price": 8.4, "remark": "用的店里的奶锅巴", "goods_id": 877, "goods_sn": "SP0000158", "tax_rate": 0, "unit_name": "盒", "goods_name": "憨野/奶锅巴/", "price_no_tax": 8.4}]	原单号:HT0010629	0	2026-04-03 09:26:33.074317	\N
150	XS202604031266	XS202604032800	12			\N	18.79	0.00	[{"num": 1, "spec": "16次泡", "price": 18.79, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 18.79}]	原单号:HT0009368	0	2026-04-03 09:26:52.849143	\N
151	XS202604033152	XS202604036715	13			\N	60.00	0.00	[{"num": 2, "spec": "16次泡", "price": 30, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 30}]	原单号:HT0009367	0	2026-04-03 09:26:54.425708	\N
152	XS202604032860	XS202604033290	5			\N	4350.00	0.00	[{"num": 50, "spec": "16次泡", "price": 27, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 27}, {"num": 50, "spec": "240克", "price": 30, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 30}, {"num": 100, "spec": "110克", "price": 15, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 15}]	原单号:HT0008993	0	2026-04-03 09:26:56.546964	\N
138	XS202604037903	XS202604033889	21			\N	890.70	0.00	[{"num": 14, "spec": "16次泡", "price": 20, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 20}, {"num": 6, "spec": "180克", "price": 9.6, "remark": "", "goods_id": 936, "goods_sn": "SP0000099", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶条/甜味/线下", "price_no_tax": 9.6}, {"num": 6, "spec": "240克", "price": 13, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 13}, {"num": 10, "spec": "110克", "price": 8, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 8}, {"num": 22, "spec": "180克", "price": 16.5, "remark": "", "goods_id": 935, "goods_sn": "SP0000100", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶皮卷/线下", "price_no_tax": 16.5}, {"num": 1, "spec": "180克", "price": 16.6, "remark": "", "goods_id": 937, "goods_sn": "SP0000098", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶皮/线下", "price_no_tax": 16.6}, {"num": 1, "spec": "180克", "price": 15.5, "remark": "", "goods_id": 934, "goods_sn": "SP0000101", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶皮千层/线下", "price_no_tax": 15.5}]	原单号:HT0010627	0	2026-04-03 09:26:34.724874	\N
139	XS202604038854	XS202604038966	21			\N	408.00	0.00	[{"num": 32, "spec": "250克", "price": 10.2, "remark": "", "goods_id": 1008, "goods_sn": "SP0000026", "tax_rate": 0, "unit_name": "袋", "goods_name": "甜味奶条成品", "price_no_tax": 10.2}, {"num": 3, "spec": "250克", "price": 11.2, "remark": "", "goods_id": 1007, "goods_sn": "SP0000027", "tax_rate": 0, "unit_name": "袋", "goods_name": "原味奶条成品", "price_no_tax": 11.2}, {"num": 5, "spec": "180克", "price": 9.6, "remark": "", "goods_id": 936, "goods_sn": "SP0000099", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶条/甜味/线下", "price_no_tax": 9.6}]	原单号:HT0010623	0	2026-04-03 09:26:36.373768	\N
140	XS202604035614	XS202604036694	21			\N	161.15	0.00	[{"num": 7, "spec": "16次泡", "price": 20, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 20}, {"num": 2, "spec": "180克", "price": 9.6, "remark": "", "goods_id": 936, "goods_sn": "SP0000099", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶条/甜味/线下", "price_no_tax": 9.6}, {"num": 6, "spec": "1", "price": 0.325, "remark": "已换算成一半价格", "goods_id": 1030, "goods_sn": "SP0000004", "tax_rate": 0, "unit_name": "张", "goods_name": "专外盒/奶果子", "price_no_tax": 0.325}]	原单号:HT0010621	0	2026-04-03 09:26:37.725936	\N
162	XS202604035765	XS202604035727	10			\N	670.00	0.00	[{"num": 13, "spec": "16次泡", "price": 51.53846, "remark": "", "goods_id": 996, "goods_sn": "SP0000038", "tax_rate": 0, "unit_name": "盒", "goods_name": "青砖奶茶成品", "price_no_tax": 51.53846}, {"num": 14, "spec": "1", "price": 0, "remark": "", "goods_id": 1017, "goods_sn": "SP0000017", "tax_rate": 0, "unit_name": "张", "goods_name": "手提袋", "price_no_tax": 0}]	原单号:HT0007753	0	2026-04-03 09:27:11.506751	\N
163	XS202604033620	XS202604038738	12			\N	551.00	0.00	[{"num": 1, "spec": "16次泡", "price": 58, "remark": "", "goods_id": 996, "goods_sn": "SP0000038", "tax_rate": 0, "unit_name": "盒", "goods_name": "青砖奶茶成品", "price_no_tax": 58}, {"num": 10, "spec": "250克", "price": 49.3, "remark": "", "goods_id": 1007, "goods_sn": "SP0000027", "tax_rate": 0, "unit_name": "袋", "goods_name": "原味奶条成品", "price_no_tax": 49.3}]	原单号:HT0007752	0	2026-04-03 09:27:12.842157	\N
164	XS202604031767	XS202604038854	5			\N	3950.00	0.00	[{"num": 60, "spec": "16次泡", "price": 27, "remark": "", "goods_id": 996, "goods_sn": "SP0000038", "tax_rate": 0, "unit_name": "盒", "goods_name": "青砖奶茶成品", "price_no_tax": 27}, {"num": 10, "spec": "250克", "price": 29, "remark": "", "goods_id": 1007, "goods_sn": "SP0000027", "tax_rate": 0, "unit_name": "袋", "goods_name": "原味奶条成品", "price_no_tax": 29}, {"num": 10, "spec": "250克", "price": 29, "remark": "", "goods_id": 1008, "goods_sn": "SP0000026", "tax_rate": 0, "unit_name": "袋", "goods_name": "甜味奶条成品", "price_no_tax": 29}, {"num": 30, "spec": "110克", "price": 15, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 15}, {"num": 20, "spec": "150克", "price": 22, "remark": "", "goods_id": 985, "goods_sn": "SP0000049", "tax_rate": 0, "unit_name": "袋", "goods_name": "甜味传统奶豆腐/袋装成品", "price_no_tax": 22}, {"num": 15, "spec": "150", "price": 22, "remark": "", "goods_id": 988, "goods_sn": "SP0000046", "tax_rate": 0, "unit_name": "袋", "goods_name": "原味传统奶豆腐/成品袋装", "price_no_tax": 22}, {"num": 10, "spec": "240克", "price": 30, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 30}, {"num": 10, "spec": "100克", "price": 23, "remark": "", "goods_id": 989, "goods_sn": "SP0000045", "tax_rate": 0, "unit_name": "瓶", "goods_name": "蒙古黄油/瓶装成品", "price_no_tax": 23}, {"num": 5, "spec": "1", "price": 0.8, "remark": "展示用赠品", "goods_id": 1029, "goods_sn": "SP0000005", "tax_rate": 0, "unit_name": "张", "goods_name": "专内盒/奶果子", "price_no_tax": 0.8}, {"num": 5, "spec": "1", "price": 0.8, "remark": "展示用赠品", "goods_id": 1030, "goods_sn": "SP0000004", "tax_rate": 0, "unit_name": "张", "goods_name": "专外盒/奶果子", "price_no_tax": 0.8}, {"num": 1, "spec": "16次泡", "price": 27, "remark": "展示用赠品", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 27}]	原单号:HT0007437	0	2026-04-03 09:27:14.438647	\N
165	XS202604033929	XS202604032553	13			\N	900.00	0.00	[{"num": 30, "spec": "16次泡", "price": 30, "remark": "", "goods_id": 996, "goods_sn": "SP0000038", "tax_rate": 0, "unit_name": "盒", "goods_name": "青砖奶茶成品", "price_no_tax": 30}]	原单号:HT0007426	0	2026-04-03 09:27:15.977284	\N
166	XS202604038349	XS202604033538	18			\N	600.00	0.00	[{"num": 30, "spec": "16次泡", "price": 20, "remark": "", "goods_id": 996, "goods_sn": "SP0000038", "tax_rate": 0, "unit_name": "盒", "goods_name": "青砖奶茶成品", "price_no_tax": 20}]	原单号:HT0007292	0	2026-04-03 09:27:17.588862	\N
144	XS202604037250	XS202604033202	21			\N	307.18	0.00	[{"num": 5, "spec": "16次泡", "price": 19.80198, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 19.80198}, {"num": 1, "spec": "250克", "price": 12.87129, "remark": "", "goods_id": 1008, "goods_sn": "SP0000026", "tax_rate": 0, "unit_name": "袋", "goods_name": "甜味奶条成品", "price_no_tax": 12.87129}, {"num": 20, "spec": "110克", "price": 7.92079, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 7.92079}, {"num": 80, "spec": "400/箱/0.423/球", "price": 0.423, "remark": "", "goods_id": 1010, "goods_sn": "SP0000024", "tax_rate": 0, "unit_name": "个", "goods_name": "奶油球", "price_no_tax": 0.423}, {"num": 1, "spec": "0", "price": 0, "remark": "", "goods_id": 995, "goods_sn": "SP0000039", "tax_rate": 0, "unit_name": "袋", "goods_name": "茶专用/热缩膜", "price_no_tax": 0}, {"num": 1, "spec": "1", "price": 0, "remark": "", "goods_id": 978, "goods_sn": "SP0000056", "tax_rate": 0, "unit_name": "张", "goods_name": "新茶专用标签纸", "price_no_tax": 0}]	原单号:HT0009457	0	2026-04-03 09:26:43.69374	\N
145	XS202604039822	XS202604039721	21			\N	259.92	0.00	[{"num": 4, "spec": "180克", "price": 16.33663, "remark": "", "goods_id": 935, "goods_sn": "SP0000100", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶皮卷/线下", "price_no_tax": 16.33663}, {"num": 144, "spec": "400/箱/0.423/球", "price": 0.423, "remark": "", "goods_id": 1010, "goods_sn": "SP0000024", "tax_rate": 0, "unit_name": "个", "goods_name": "奶油球", "price_no_tax": 0.423}, {"num": 4, "spec": "180克", "price": 16.6, "remark": "", "goods_id": 937, "goods_sn": "SP0000098", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶皮/线下", "price_no_tax": 16.6}, {"num": 2, "spec": "140克", "price": 16.5, "remark": "", "goods_id": 938, "goods_sn": "SP0000097", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶酪/甜味/线下", "price_no_tax": 16.5}, {"num": 2, "spec": "140克", "price": 16.5, "remark": "", "goods_id": 941, "goods_sn": "SP0000094", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶酪/原味/线下", "price_no_tax": 16.5}]	原单号:HT0009456	0	2026-04-03 09:26:45.167299	\N
147	XS202604038370	XS202604032034	21			\N	185.37	0.00	[{"num": 4, "spec": "140克", "price": 9.70297, "remark": "", "goods_id": 964, "goods_sn": "SP0000070", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/冻炒米/线下", "price_no_tax": 9.70297}, {"num": 5, "spec": "180克", "price": 16.43564, "remark": "", "goods_id": 937, "goods_sn": "SP0000098", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶皮/线下", "price_no_tax": 16.43564}, {"num": 3, "spec": "180克", "price": 16.33663, "remark": "", "goods_id": 935, "goods_sn": "SP0000100", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶皮卷/线下", "price_no_tax": 16.33663}, {"num": 32, "spec": "400/箱/0.423/球", "price": 0.423, "remark": "", "goods_id": 1010, "goods_sn": "SP0000024", "tax_rate": 0, "unit_name": "个", "goods_name": "奶油球", "price_no_tax": 0.423}, {"num": 2, "spec": "1", "price": 0, "remark": "", "goods_id": 978, "goods_sn": "SP0000056", "tax_rate": 0, "unit_name": "张", "goods_name": "新茶专用标签纸", "price_no_tax": 0}, {"num": 2, "spec": "0", "price": 0, "remark": "", "goods_id": 995, "goods_sn": "SP0000039", "tax_rate": 0, "unit_name": "袋", "goods_name": "茶专用/热缩膜", "price_no_tax": 0}]	原单号:HT0009451	0	2026-04-03 09:26:48.493061	\N
148	XS202604039375	XS202604033581	21			\N	385.64	0.00	[{"num": 10, "spec": "16次泡", "price": 20, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 20}, {"num": 5, "spec": "140克", "price": 16.5, "remark": "", "goods_id": 938, "goods_sn": "SP0000097", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶酪/甜味/线下", "price_no_tax": 16.5}, {"num": 5, "spec": "140克", "price": 16.5, "remark": "", "goods_id": 941, "goods_sn": "SP0000094", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶酪/原味/线下", "price_no_tax": 16.5}, {"num": 2, "spec": "1", "price": 0, "remark": "", "goods_id": 1032, "goods_sn": "SP0000002", "tax_rate": 0, "unit_name": "张", "goods_name": "专盒/冻炒米", "price_no_tax": 0}, {"num": 1, "spec": "1", "price": 0, "remark": "", "goods_id": 993, "goods_sn": "SP0000041", "tax_rate": 0, "unit_name": "张", "goods_name": "冻炒米专用/塑膜袋", "price_no_tax": 0}, {"num": 3, "spec": "1", "price": 0, "remark": "", "goods_id": 1030, "goods_sn": "SP0000004", "tax_rate": 0, "unit_name": "张", "goods_name": "专外盒/奶果子", "price_no_tax": 0}, {"num": 48, "spec": "400/箱/0.423/球", "price": 0.43, "remark": "", "goods_id": 1010, "goods_sn": "SP0000024", "tax_rate": 0, "unit_name": "个", "goods_name": "奶油球", "price_no_tax": 0.43}, {"num": 3, "spec": "1", "price": 0, "remark": "", "goods_id": 1033, "goods_sn": "SP0000001", "tax_rate": 0, "unit_name": "张", "goods_name": "专袋/奶条", "price_no_tax": 0}]	原单号:HT0009450	0	2026-04-03 09:26:49.928877	\N
149	XS202604035932	XS202604032346	21			\N	60.50	0.00	[{"num": 3, "spec": "180克", "price": 10.39604, "remark": "", "goods_id": 933, "goods_sn": "SP0000102", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶条/原味/线下", "price_no_tax": 10.39604}, {"num": 2, "spec": "180克", "price": 9.50495, "remark": "", "goods_id": 936, "goods_sn": "SP0000099", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶条/甜味/线下", "price_no_tax": 9.50495}, {"num": 1, "spec": "140克", "price": 9.70297, "remark": "", "goods_id": 964, "goods_sn": "SP0000070", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/冻炒米/线下", "price_no_tax": 9.70297}]	原单号:HT0009446	0	2026-04-03 09:26:51.27368	\N
153	XS202604036035	XS202604035974	5			\N	5156.00	0.00	[{"num": 50, "spec": "16次泡", "price": 27, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 27}, {"num": 46, "spec": "150", "price": 22, "remark": "", "goods_id": 988, "goods_sn": "SP0000046", "tax_rate": 0, "unit_name": "袋", "goods_name": "原味传统奶豆腐/成品袋装", "price_no_tax": 22}, {"num": 27, "spec": "150克", "price": 22, "remark": "", "goods_id": 985, "goods_sn": "SP0000049", "tax_rate": 0, "unit_name": "袋", "goods_name": "甜味传统奶豆腐/袋装成品", "price_no_tax": 22}, {"num": 50, "spec": "110克", "price": 15, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 15}, {"num": 25, "spec": "250克", "price": 29, "remark": "", "goods_id": 1008, "goods_sn": "SP0000026", "tax_rate": 0, "unit_name": "袋", "goods_name": "甜味奶条成品", "price_no_tax": 29}, {"num": 25, "spec": "250克", "price": 29, "remark": "", "goods_id": 1007, "goods_sn": "SP0000027", "tax_rate": 0, "unit_name": "袋", "goods_name": "原味奶条成品", "price_no_tax": 29}]	原单号:HT0008988	0	2026-04-03 09:26:58.193748	\N
156	XS202604038631	XS202604033548	13			\N	840.00	0.00	[{"num": 28, "spec": "16次泡", "price": 30, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 30}]	原单号:HT0008459	0	2026-04-03 09:27:02.390168	\N
157	XS202604032383	XS202604031501	21			\N	1099.00	0.00	[{"num": 33, "spec": "16次泡", "price": 17.5, "remark": "", "goods_id": 980, "goods_sn": "SP0000054", "tax_rate": 0, "unit_name": "盒", "goods_name": "新/青砖奶茶", "price_no_tax": 17.5}, {"num": 24, "spec": "240克", "price": 20, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 20}, {"num": 1, "spec": "150", "price": 18.5, "remark": "", "goods_id": 988, "goods_sn": "SP0000046", "tax_rate": 0, "unit_name": "袋", "goods_name": "原味传统奶豆腐/成品袋装", "price_no_tax": 18.5}, {"num": 2, "spec": "斤/两盒", "price": 11.5, "remark": "", "goods_id": 981, "goods_sn": "SP0000053", "tax_rate": 0, "unit_name": "盒", "goods_name": "烤奶皮", "price_no_tax": 11.5}]	原单号:HT0008418	0	2026-04-03 09:27:03.953854	\N
171	XS202604034123	XS202604031870	10			\N	231.00	0.00	[{"num": 1, "spec": "100克", "price": 39, "remark": "", "goods_id": 989, "goods_sn": "SP0000045", "tax_rate": 0, "unit_name": "瓶", "goods_name": "蒙古黄油/瓶装成品", "price_no_tax": 39}, {"num": 2, "spec": "100克", "price": 39, "remark": "", "goods_id": 989, "goods_sn": "SP0000045", "tax_rate": 0, "unit_name": "瓶", "goods_name": "蒙古黄油/瓶装成品", "price_no_tax": 39}, {"num": 2, "spec": "150", "price": 33, "remark": "", "goods_id": 988, "goods_sn": "SP0000046", "tax_rate": 0, "unit_name": "袋", "goods_name": "原味传统奶豆腐/成品袋装", "price_no_tax": 33}, {"num": 1, "spec": "240克", "price": 48, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 48}]	原单号:HT0006751	0	2026-04-03 09:27:25.378695	\N
173	XS202604034615	XS202604031852	12			\N	48.00	0.00	[{"num": 1, "spec": "16次泡", "price": 48, "remark": "", "goods_id": 996, "goods_sn": "SP0000038", "tax_rate": 0, "unit_name": "盒", "goods_name": "青砖奶茶成品", "price_no_tax": 48}]	原单号:HT0006749	0	2026-04-03 09:27:28.639159	\N
174	XS202604032726	XS202604033881	21			\N	537.50	0.00	[{"num": 20, "spec": "250克", "price": 13, "remark": "", "goods_id": 1008, "goods_sn": "SP0000026", "tax_rate": 0, "unit_name": "袋", "goods_name": "甜味奶条成品", "price_no_tax": 13}, {"num": 15, "spec": "240克", "price": 18.5, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 18.5}]	原单号:HT0006748	0	2026-04-03 09:27:30.203621	\N
175	XS202604037162	XS202604037856	13			\N	330.00	0.00	[{"num": 11, "spec": "16次泡", "price": 30, "remark": "", "goods_id": 996, "goods_sn": "SP0000038", "tax_rate": 0, "unit_name": "盒", "goods_name": "青砖奶茶成品", "price_no_tax": 30}]	原单号:HT0006747	0	2026-04-03 09:27:31.617229	\N
176	XS202604036140	XS202604031951	21			\N	3060.00	0.00	[{"num": 180, "spec": "16次泡", "price": 17, "remark": "", "goods_id": 996, "goods_sn": "SP0000038", "tax_rate": 0, "unit_name": "盒", "goods_name": "青砖奶茶成品", "price_no_tax": 17}]	原单号:HT0006746	0	2026-04-03 09:27:33.008003	\N
177	XS202604031376	XS202604036168	18			\N	2720.00	0.00	[{"num": 30, "spec": "240克", "price": 22, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 22}, {"num": 30, "spec": "16次泡", "price": 20, "remark": "", "goods_id": 996, "goods_sn": "SP0000038", "tax_rate": 0, "unit_name": "盒", "goods_name": "青砖奶茶成品", "price_no_tax": 20}, {"num": 28, "spec": "250克", "price": 20, "remark": "", "goods_id": 1007, "goods_sn": "SP0000027", "tax_rate": 0, "unit_name": "袋", "goods_name": "原味奶条成品", "price_no_tax": 20}, {"num": 30, "spec": "250克", "price": 20, "remark": "", "goods_id": 1008, "goods_sn": "SP0000026", "tax_rate": 0, "unit_name": "袋", "goods_name": "甜味奶条成品", "price_no_tax": 20}, {"num": 30, "spec": "110克", "price": 10, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 10}]	原单号:HT0006745	0	2026-04-03 09:27:34.712827	\N
179	XS202604037910	XS202604037057	56			\N	849.00	0.00	[{"num": 10, "spec": "110克", "price": 36, "remark": "", "goods_id": 994, "goods_sn": "SP0000040", "tax_rate": 0, "unit_name": "盒", "goods_name": "冻炒米成品盒", "price_no_tax": 36}, {"num": 5, "spec": "240克", "price": 58, "remark": "", "goods_id": 992, "goods_sn": "SP0000042", "tax_rate": 0, "unit_name": "盒", "goods_name": "奶果子/盒装/成品", "price_no_tax": 58}, {"num": 2, "spec": "100克", "price": 39, "remark": "", "goods_id": 989, "goods_sn": "SP0000045", "tax_rate": 0, "unit_name": "瓶", "goods_name": "蒙古黄油/瓶装成品", "price_no_tax": 39}, {"num": 5, "spec": "180克", "price": 29.8, "remark": "", "goods_id": 937, "goods_sn": "SP0000098", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/鲜奶皮/线下", "price_no_tax": 29.8}, {"num": 4, "spec": "180克", "price": 26.6, "remark": "", "goods_id": 935, "goods_sn": "SP0000100", "tax_rate": 0, "unit_name": "盒", "goods_name": "透明成品/奶皮卷/线下", "price_no_tax": 26.6}]	原单号:HT0012157	0	2026-04-03 09:28:49.103379	\N
\.


--
-- Data for Name: sale_customers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_customers (id, name, nickname, code, mobile, tel, email, address, contact, level_name, source_name, level_id, source_id, follow_admin_id, follow_admin, balance, is_sea, remark, status, create_time, update_time, deleted_at) FROM stdin;
1	奈日青城咖啡/玉泉区	奈日青城咖啡/玉泉区							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:07.248506	2026-03-29 08:15:07.248506	\N
2	放牛娃/呼伦贝尔	放牛娃/呼伦贝尔							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:07.697787	2026-03-29 08:15:07.697787	\N
3	阿润诺尔	阿润诺尔							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:08.158673	2026-03-29 08:15:08.158673	\N
4	乌海城市文化传媒有限公司	乌海城市文化传媒有限公司							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:08.637813	2026-03-29 08:15:08.637813	\N
5	蒙优农品	蒙优农品							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:09.086682	2026-03-29 08:15:09.086682	\N
6	一件代发客户	一件代发客户							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:09.566793	2026-03-29 08:15:09.566793	\N
7	电商/抖音专用	电商/抖音专用							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:10.018866	2026-03-29 08:15:10.018866	\N
8	电商/淘宝专用	电商/淘宝专用							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:10.545409	2026-03-29 08:15:10.545409	\N
9	线下/美团专用	线下/美团专用							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:11.016352	2026-03-29 08:15:11.016352	\N
10	电商/微信小店	电商/微信小店							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:11.475144	2026-03-29 08:15:11.475144	\N
11	电商/小红书	电商/小红书							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:11.96259	2026-03-29 08:15:11.96259	\N
12	电商/拼多多	电商/拼多多							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:12.393471	2026-03-29 08:15:12.393471	\N
13	五洲四海	五洲四海							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:12.876992	2026-03-29 08:15:12.876992	\N
14	零售/散单/点这个	零售/散单/点这个							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:13.300079	2026-03-29 08:15:13.300079	\N
15	线下店铺/零售专用	线下店铺/零售专用							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:13.85502	2026-03-29 08:15:13.85502	\N
16	样品专用客户	样品专用客户							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:14.339846	2026-03-29 08:15:14.339846	\N
17	呼市扎那家	呼市扎那家							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:14.80841	2026-03-29 08:15:14.80841	\N
18	鄂尔多斯游牧大市集	鄂尔多斯游牧大市集							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:15.296539	2026-03-29 08:15:15.296539	\N
19	呼市武小满咖啡研究所	呼市武小满咖啡研究所							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:15.740771	2026-03-29 08:15:15.740771	\N
20	呼市蒙古商城唐斯格乳制品	呼市蒙古商城唐斯格乳制品							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:16.299177	2026-03-29 08:15:16.299177	\N
21	阿斯娜	阿斯娜							普通客户		0	0	0		0.00	0		1	2026-03-29 08:15:16.741966	2026-03-29 08:15:16.741966	\N
55	奈日青城咖啡/玉泉区								普通客户		0	0	0		0.00	0		1	2026-04-03 08:34:47.955203	2026-04-03 08:34:47.955203	\N
56	放牛娃/呼伦贝尔								普通客户		0	0	0		0.00	0		1	2026-04-03 09:28:38.612039	2026-04-03 09:28:38.612039	\N
\.


--
-- Data for Name: sale_offers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_offers (id, order_no, customer_id, customer_name, admin_name, offer_date, total_amount, goods_info, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: sale_out_order; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_out_order (id, order_no, order_sn, customer_id, customer_name, admin_name, out_date, total_amount, goods_info, remark, status, warehouse_id, warehouse_name, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: sale_return_order; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_return_order (id, order_no, customer_id, customer_name, return_date, goods_info, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: staff; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.staff (id, name, code, mobile, email, dept_id, dept_name, job_id, job_name, entry_date, gender, status, remark, created_at) FROM stdin;
\.


--
-- Data for Name: stock_checks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_checks (id, order_no, warehouse_id, warehouse_name, goods_info, remark, status, admin_name, created_at) FROM stdin;
\.


--
-- Data for Name: stock_flow; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_flow (id, goods_id, goods_name, warehouse_id, warehouse_name, type, qty, before_qty, after_qty, order_no, remark, created_at) FROM stdin;
101	1033	专袋/奶条	0		procure_in_reverse	-51	0	0	CGRK202603318146	采购入库反审核	2026-03-31 06:08:00.628408
102	1033	专袋/奶条	0		procure_in_reverse	-84	0	0	CGRK202603318146	采购入库反审核	2026-03-31 06:08:00.64454
103	1033	专袋/奶条	0		procure_in_reverse	-2	0	0	CGRK202603318146	采购入库反审核	2026-03-31 06:08:00.649589
104	1033	专袋/奶条	0		procure_in_reverse	-48	0	0	CGRK202603318146	采购入库反审核	2026-03-31 06:08:00.654137
105	1033	专袋/奶条	0		procure_in	51	0	51	CGRK202603318146	采购入库审核	2026-03-31 06:08:01.626847
106	1033	专袋/奶条	0		procure_in	84	51	135	CGRK202603318146	采购入库审核	2026-03-31 06:08:01.639576
107	1033	专袋/奶条	0		procure_in	2	135	137	CGRK202603318146	采购入库审核	2026-03-31 06:08:01.649716
108	1033	专袋/奶条	0		procure_in	48	137	185	CGRK202603318146	采购入库审核	2026-03-31 06:08:01.658606
109	1033	专袋/奶条	0		procure_in_reverse	-51	185	134	CGRK202603318146	采购入库反审核	2026-03-31 10:50:58.593465
110	1033	专袋/奶条	0		procure_in_reverse	-84	134	50	CGRK202603318146	采购入库反审核	2026-03-31 10:50:58.61364
111	1033	专袋/奶条	0		procure_in_reverse	-2	50	48	CGRK202603318146	采购入库反审核	2026-03-31 10:50:58.623742
112	1033	专袋/奶条	0		procure_in_reverse	-48	48	0	CGRK202603318146	采购入库反审核	2026-03-31 10:50:58.6363
113	1033	专袋/奶条	0		procure_in	51	0	51	CGRK202603318146	采购入库审核	2026-03-31 10:51:14.52563
114	1033	专袋/奶条	0		procure_in	84	51	135	CGRK202603318146	采购入库审核	2026-03-31 10:51:14.540201
115	1033	专袋/奶条	0		procure_in	2	135	137	CGRK202603318146	采购入库审核	2026-03-31 10:51:14.549935
116	1033	专袋/奶条	0		procure_in	48	137	185	CGRK202603318146	采购入库审核	2026-03-31 10:51:14.55929
117	1033	专袋/奶条	0		procure_in	51	185	236	CGRK202603318453	采购入库审核	2026-03-31 12:12:18.915817
118	1033	专袋/奶条	0		procure_in	84	236	320	CGRK202603318453	采购入库审核	2026-03-31 12:12:18.928599
119	1033	专袋/奶条	0		procure_in	2	320	322	CGRK202603318453	采购入库审核	2026-03-31 12:12:18.941608
120	1033	专袋/奶条	0		procure_in	48	322	370	CGRK202603318453	采购入库审核	2026-03-31 12:12:18.953581
121	902	乌日莫糖/散装	0		procure_in	5	0	5	CGRK202603314400	采购入库审核	2026-03-31 12:22:01.561957
122	1032	专盒/冻炒米	0		procure_in	32	0	32	CGRK202603311619	采购入库审核	2026-03-31 13:10:06.336678
123	902	乌日莫糖/散装	0		procure_in_reverse	-5	5	0	CGRK202603314400	采购入库反审核	2026-03-31 13:32:32.736138
124	981	烤奶皮	0		procure_in	10	0	10	CGRK202603315191	采购入库审核	2026-03-31 13:32:43.947375
125	1033	专袋/奶条	0		procure_in_reverse	-51	370	319	CGRK202603318146	采购入库反审核	2026-03-31 13:58:08.872717
126	1033	专袋/奶条	0		procure_in_reverse	-84	319	235	CGRK202603318146	采购入库反审核	2026-03-31 13:58:08.891336
127	1033	专袋/奶条	0		procure_in_reverse	-2	235	233	CGRK202603318146	采购入库反审核	2026-03-31 13:58:08.897752
128	1033	专袋/奶条	0		procure_in_reverse	-48	233	185	CGRK202603318146	采购入库反审核	2026-03-31 13:58:08.904597
129	902	乌日莫糖/散装	0		procure_in	5	0	5	CGRK202603314400	采购入库审核	2026-03-31 15:23:56.2159
130	921	嚼口脆炒米糖/散装	0		procure_in	5	0	5	CGRK202603319747	采购入库审核	2026-03-31 15:23:58.44294
131	922	酸奶炒米糖/散装	0		procure_in	5	0	5	CGRK202603318354	采购入库审核	2026-03-31 15:24:00.604334
132	920	手工乌日末液体	0		procure_in	10	0	10	CGRK202603314800	采购入库审核	2026-03-31 15:24:02.707933
133	857	厚奶皮	0		procure_in	20	0	20	CGRK202603312834	采购入库审核	2026-03-31 15:24:04.896291
134	804	德吉酸奶/2斤装	0		procure_in	10	0	10	CGRK202603316167	采购入库审核	2026-03-31 15:24:07.13807
135	805	德吉酸奶/一斤装	0		procure_in	10	0	10	CGRK202603316167	采购入库审核	2026-03-31 15:24:07.147948
136	806	德吉酸奶/半斤	0		procure_in	10	0	10	CGRK202603316167	采购入库审核	2026-03-31 15:24:07.158091
137	811	蒙古果子/格日勒	0		procure_in	12	0	12	CGRK202603316519	采购入库审核	2026-03-31 15:24:09.836644
138	908	哈斯乌拉牛肉干500g原味	0		procure_in	10	0	10	CGRK202603317521	采购入库审核	2026-03-31 15:24:13.064314
139	856	科尔沁/大奶豆腐	0		procure_in	5	0	5	CGRK202603317495	采购入库审核	2026-03-31 15:24:15.012962
140	829	奶豆腐/原味/中/科尔沁	0		procure_in	5	0	5	CGRK202603317495	采购入库审核	2026-03-31 15:24:15.021941
141	903	盛宇燃奶豆腐/甜味	0		procure_in	5	0	5	CGRK202603317495	采购入库审核	2026-03-31 15:24:15.03154
142	904	盛宇燃奶豆腐/原味	0		procure_in	5	0	5	CGRK202603317495	采购入库审核	2026-03-31 15:24:15.041541
143	907	风干牛肉500g大片	0		procure_in	5	0	5	CGRK202603313556	采购入库审核	2026-03-31 15:24:17.183737
144	921	嚼口脆炒米糖/散装	0		procure_in	5	5	10	CGRK202603313556	采购入库审核	2026-03-31 15:24:17.193223
145	932	炒米海丰	0		procure_in	20	0	20	CGRK202603313556	采购入库审核	2026-03-31 15:24:17.202883
146	931	炒米粉/aag	0		procure_in	10	0	10	CGRK202603313556	采购入库审核	2026-03-31 15:24:17.212007
147	823	黄油/中瓶	0		procure_in	10	0	10	CGRK202603313556	采购入库审核	2026-03-31 15:24:17.220944
148	907	风干牛肉500g大片	0		procure_in	2	5	7	CGRK202603312507	采购入库审核	2026-03-31 15:24:19.446846
149	916	脆奶条/散装/科尔沁	0		procure_in	10	0	10	CGRK202603312507	采购入库审核	2026-03-31 15:24:19.455944
150	903	盛宇燃奶豆腐/甜味	0		procure_in	5	5	10	CGRK202603312507	采购入库审核	2026-03-31 15:24:19.46456
151	904	盛宇燃奶豆腐/原味	0		procure_in	5	5	10	CGRK202603312507	采购入库审核	2026-03-31 15:24:19.473229
152	823	黄油/中瓶	0		procure_in	5	10	15	CGRK202603312507	采购入库审核	2026-03-31 15:24:19.481702
153	822	黄油/大瓶/科尔沁	0		procure_in	5	0	5	CGRK202603312507	采购入库审核	2026-03-31 15:24:19.490437
154	829	奶豆腐/原味/中/科尔沁	0		procure_in	5	5	10	CGRK202603312507	采购入库审核	2026-03-31 15:24:19.499583
155	908	哈斯乌拉牛肉干500g原味	0		procure_in	2	10	12	CGRK202603312507	采购入库审核	2026-03-31 15:24:19.508231
156	923	炒米/散装/硬口	0		procure_in	30	0	30	CGRK202603313924	采购入库审核	2026-03-31 15:24:21.686131
157	920	手工乌日末液体	0		procure_in	10	10	20	CGRK202603314071	采购入库审核	2026-03-31 15:24:23.751838
158	825	故乡宝酸马奶	0		procure_in	3	0	3	CGRK202603315252	采购入库审核	2026-03-31 15:24:25.903407
159	826	乌日汗酸奶	0		procure_in	5	0	5	CGRK202603315252	采购入库审核	2026-03-31 15:24:25.912536
160	829	奶豆腐/原味/中/科尔沁	0		procure_in	5	10	15	CGRK202603316821	采购入库审核	2026-03-31 15:24:28.461839
161	901	手工白花炒米/散装	0		procure_in	30	0	30	CGRK202603312902	采购入库审核	2026-03-31 15:24:31.303874
162	830	小米/10斤/小袋	0		procure_in	2	0	2	CGRK202603317338	采购入库审核	2026-03-31 15:24:33.47985
163	830	小米/10斤/小袋	0		procure_in	5	2	7	CGRK202603317338	采购入库审核	2026-03-31 15:24:33.491806
164	809	10斤装/小米/绿色纸盒	0		procure_in	8	0	8	CGRK202603317338	采购入库审核	2026-03-31 15:24:33.504088
166	920	手工乌日末液体	0		procure_in	10	20	30	CGRK202603313280	采购入库审核	2026-03-31 15:24:37.754196
172	880	阿润月饼/五仁馅	0		procure_in	10	0	10	CGRK202603311146	采购入库审核	2026-03-31 15:24:44.617828
173	882	阿润月饼/黄油渣馅	0		procure_in	5	0	5	CGRK202603311146	采购入库审核	2026-03-31 15:24:44.626926
174	831	果条/阿润	0		procure_in	5	0	5	CGRK202603311146	采购入库审核	2026-03-31 15:24:44.636032
179	838	奶粉蒙古国	0		procure_in	3	0	3	CGRK202603318071	采购入库审核	2026-03-31 15:24:51.692495
180	839	奶皮子粉	0		procure_in	4	0	4	CGRK202603318071	采购入库审核	2026-03-31 15:24:51.702126
181	840	奶茶粉战粮	0		procure_in	2	0	2	CGRK202603318071	采购入库审核	2026-03-31 15:24:51.711979
182	841	奶茶粉贡格尔	0		procure_in	2	0	2	CGRK202603318071	采购入库审核	2026-03-31 15:24:51.721301
183	842	努德勒沁调和茶	0		procure_in	2	0	2	CGRK202603318071	采购入库审核	2026-03-31 15:24:51.730493
184	843	阿依古丽奶茶专用红茶	0		procure_in	2	0	2	CGRK202603318071	采购入库审核	2026-03-31 15:24:51.739458
185	844	希日嘎拉奶茶专用茶	0		procure_in	2	0	2	CGRK202603318071	采购入库审核	2026-03-31 15:24:51.749148
186	837	甜味奶豆腐块儿/大	0		procure_in	5	0	5	CGRK202603318071	采购入库审核	2026-03-31 15:24:51.763622
187	844	希日嘎拉奶茶专用茶	0		procure_in	2	2	4	CGRK202603318071	采购入库审核	2026-03-31 15:24:51.774549
193	920	手工乌日末液体	0		procure_in	10	30	40	CGRK202603315575	采购入库审核	2026-03-31 15:24:58.135416
195	852	牛肉干/散/孜然	0		procure_in	5	0	5	CGRK202603311311	采购入库审核	2026-03-31 15:25:02.624113
196	853	牛肉干/散/香辣	0		procure_in	5	0	5	CGRK202603311311	采购入库审核	2026-03-31 15:25:02.634036
197	854	牛肉干/散/原味	0		procure_in	5	0	5	CGRK202603311311	采购入库审核	2026-03-31 15:25:02.643032
199	850	红糖袋/delicious	0		procure_in	100	0	100	CGRK202603313441	采购入库审核	2026-03-31 15:25:07.23636
201	856	科尔沁/大奶豆腐	0		procure_in	3	10	13	CGRK202603318248	采购入库审核	2026-03-31 15:25:11.737558
202	923	炒米/散装/硬口	0		procure_in	1	30	31	CGRK202603318248	采购入库审核	2026-03-31 15:25:11.746945
204	857	厚奶皮	0		procure_in	10	40	50	CGRK202603316752	采购入库审核	2026-03-31 15:25:19.160702
207	879	干肉奶茶	0		procure_in	10	0	10	CGRK202603313952	采购入库审核	2026-03-31 15:25:24.500027
208	859	糖/阿润	0		procure_in	25	0	25	CGRK202603313952	采购入库审核	2026-03-31 15:25:24.509175
209	858	糖葫芦	0		procure_in	40	0	40	CGRK202603319491	采购入库审核	2026-03-31 15:25:26.682998
211	920	手工乌日末液体	0		procure_in	10	40	50	CGRK202603312455	采购入库审核	2026-03-31 15:25:31.499403
213	860	普通瓜子	0		procure_in	5	10	15	CGRK202603317076	采购入库审核	2026-03-31 15:25:35.930623
214	861	五香瓜子	0		procure_in	10	0	10	CGRK202603317076	采购入库审核	2026-03-31 15:25:35.940618
1450	1016	专瓶/黄油	0		procure_in	240	0	240	CGRK202603312940	采购入库审核	2026-03-31 16:41:29.325017
1451	862	专瓶/黄油渣	0		procure_in	120	0	120	CGRK202603312940	采购入库审核	2026-03-31 16:41:29.331712
1452	1027	真空袋	0		procure_in	500	0	500	CGRK202603313044	采购入库审核	2026-03-31 16:41:30.863612
1454	1016	专瓶/黄油	0		procure_in	240	240	480	CGRK202603312017	采购入库审核	2026-03-31 16:41:35.028534
1455	862	专瓶/黄油渣	0		procure_in	120	120	240	CGRK202603312017	采购入库审核	2026-03-31 16:41:35.035376
1456	1027	真空袋	0		procure_in	500	500	1000	CGRK202603312344	采购入库审核	2026-03-31 16:41:37.019648
1458	991	奶果子/散装	0		procure_in	86	205	291	CGRK202603313831	采购入库审核	2026-03-31 16:41:40.879742
1460	1000	木勺	0		procure_in	10	0	10	CGRK202603317084	采购入库审核	2026-03-31 16:41:45.671016
1462	1002	封口机/真空	0		procure_in	1	2	3	CGRK202603312389	采购入库审核	2026-03-31 16:41:49.100701
1468	983	甜味/标签/不干胶/传统奶豆腐	0		procure_in	25	500	525	CGRK202603311075	采购入库审核	2026-03-31 16:41:56.12674
1469	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	25	500	525	CGRK202603311075	采购入库审核	2026-03-31 16:41:56.13311
1470	999	茶专用/不干胶/标签	0		procure_in	60	0	60	CGRK202603311075	采购入库审核	2026-03-31 16:41:56.139689
1475	983	甜味/标签/不干胶/传统奶豆腐	0		procure_in	25	525	550	CGRK202603313456	采购入库审核	2026-03-31 16:42:00.788477
1476	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	25	525	550	CGRK202603313456	采购入库审核	2026-03-31 16:42:00.795079
1477	999	茶专用/不干胶/标签	0		procure_in	60	60	120	CGRK202603313456	采购入库审核	2026-03-31 16:42:00.802631
1480	989	蒙古黄油/瓶装成品	0		procure_in	1	0	1	CGRK202603312720	采购入库审核	2026-03-31 16:42:06.399579
1481	989	蒙古黄油/瓶装成品	0		procure_in	2	1	3	CGRK202603312720	采购入库审核	2026-03-31 16:42:06.405901
1482	988	原味传统奶豆腐/成品袋装	0		procure_in	2	0	2	CGRK202603312720	采购入库审核	2026-03-31 16:42:06.412098
1484	1013	冻炒米/给组装半成品/那牧尔	0		procure_in	3	480	483	CGRK202603315166	采购入库审核	2026-03-31 16:42:09.649825
1487	1003	热收缩膜机	0		procure_in	1	0	1	CGRK202603313416	采购入库审核	2026-03-31 16:42:15.507085
1488	1015	散装/原味奶条	0		procure_in	16	86	102	CGRK202603314584	采购入库审核	2026-03-31 16:42:17.193923
1490	1015	散装/原味奶条	0		procure_in	9	111	120	CGRK202603314191	采购入库审核	2026-03-31 16:42:20.676708
1493	1013	冻炒米/给组装半成品/那牧尔	0		procure_in	30	483	513	CGRK202603311843	采购入库审核	2026-03-31 16:42:24.524482
1495	1015	散装/原味奶条	0		procure_in	15	120	135	CGRK202603315894	采购入库审核	2026-03-31 16:42:27.487431
1496	1010	奶油球	0		procure_in	8	60	68	CGRK202603316571	采购入库审核	2026-03-31 16:42:28.996268
1497	1011	茶包	0		procure_in	8	10	18	CGRK202603311827	采购入库审核	2026-03-31 16:42:31.057551
1500	1000	木勺	0		procure_in	2	10	12	CGRK202603317862	采购入库审核	2026-03-31 16:42:35.280856
1501	1000	木勺	0		procure_in	200	12	212	CGRK202603317862	采购入库审核	2026-03-31 16:42:35.287258
1504	995	茶专用/热缩膜	0		procure_in	10	2600	2610	CGRK202603312868	采购入库审核	2026-03-31 16:42:38.228586
1506	993	冻炒米专用/塑膜袋	0		procure_in	500	2000	2500	CGRK202603311837	采购入库审核	2026-03-31 16:42:41.895041
1508	990	奶果子/专用塑膜袋	0		procure_in	1000	0	1000	CGRK202603317539	采购入库审核	2026-03-31 16:42:46.266641
165	857	厚奶皮	0		procure_in	20	20	40	CGRK202603317175	采购入库审核	2026-03-31 15:24:35.576628
167	981	烤奶皮	0		procure_in	40	10	50	CGRK202603317026	采购入库审核	2026-03-31 15:24:40.010155
168	903	盛宇燃奶豆腐/甜味	0		procure_in	3	10	13	CGRK202603317026	采购入库审核	2026-03-31 15:24:40.019058
169	904	盛宇燃奶豆腐/原味	0		procure_in	4	10	14	CGRK202603317026	采购入库审核	2026-03-31 15:24:40.027649
170	921	嚼口脆炒米糖/散装	0		procure_in	10	10	20	CGRK202603317026	采购入库审核	2026-03-31 15:24:40.037943
171	860	普通瓜子	0		procure_in	10	0	10	CGRK202603313622	采购入库审核	2026-03-31 15:24:42.338853
175	916	脆奶条/散装/科尔沁	0		procure_in	10	10	20	CGRK202603314323	采购入库审核	2026-03-31 15:24:46.797073
176	845	乳清饮料	0		procure_in	20	0	20	CGRK202603318569	采购入库审核	2026-03-31 15:24:49.498349
177	846	酸奶/额吉伊德	0		procure_in	6	0	6	CGRK202603318569	采购入库审核	2026-03-31 15:24:49.50746
178	847	乌日莫/袋装	0		procure_in	5	0	5	CGRK202603318569	采购入库审核	2026-03-31 15:24:49.516652
188	836	礼盒/2026	0		procure_in	540	0	540	CGRK202603315542	采购入库审核	2026-03-31 15:24:53.947932
189	902	乌日莫糖/散装	0		procure_in	5	5	10	CGRK202603312174	采购入库审核	2026-03-31 15:24:55.953975
190	922	酸奶炒米糖/散装	0		procure_in	5	5	10	CGRK202603312174	采购入库审核	2026-03-31 15:24:55.962892
191	921	嚼口脆炒米糖/散装	0		procure_in	5	20	25	CGRK202603312174	采购入库审核	2026-03-31 15:24:55.972142
192	856	科尔沁/大奶豆腐	0		procure_in	5	5	10	CGRK202603312174	采购入库审核	2026-03-31 15:24:55.981549
194	855	奶锅巴/扎旗吉十奶制品	0		procure_in	5	0	5	CGRK202603316221	采购入库审核	2026-03-31 15:25:00.2992
198	851	晴王糖葫芦	0		procure_in	10	0	10	CGRK202603315216	采购入库审核	2026-03-31 15:25:05.157187
200	993	冻炒米专用/塑膜袋	0		procure_in	2000	0	2000	CGRK202603314948	采购入库审核	2026-03-31 15:25:09.481888
203	872	半成品/黄金纬度牛肉干/那牧尔	0		procure_in	130	0	130	CGRK202603315956	采购入库审核	2026-03-31 15:25:13.94174
205	981	烤奶皮	0		procure_in	10	50	60	CGRK202603314690	采购入库审核	2026-03-31 15:25:21.871482
206	901	手工白花炒米/散装	0		procure_in	30	30	60	CGRK202603314690	采购入库审核	2026-03-31 15:25:21.880954
210	1011	茶包	0		procure_in	10	0	10	CGRK202603319187	采购入库审核	2026-03-31 15:25:29.234283
212	963	小/方形/亚克力盒/	0		procure_in	720	0	720	CGRK202603315735	采购入库审核	2026-03-31 15:25:33.710203
215	931	炒米粉/aag	0		procure_in	10	10	20	CGRK202603318844	采购入库审核	2026-03-31 15:25:40.221153
216	997	茶专用/盐包	0		procure_in	10	0	10	CGRK202603314559	采购入库审核	2026-03-31 15:25:43.302918
217	991	奶果子/散装	0		procure_in	119	0	119	CGRK202603319311	采购入库审核	2026-03-31 15:25:46.624192
218	923	炒米/散装/硬口	0		procure_in	1	31	32	CGRK202603311529	采购入库审核	2026-03-31 15:25:49.265307
219	981	烤奶皮	0		procure_in	10	60	70	CGRK202603311529	采购入库审核	2026-03-31 15:25:49.275095
220	908	哈斯乌拉牛肉干500g原味	0		procure_in	3	12	15	CGRK202603311529	采购入库审核	2026-03-31 15:25:49.285977
221	907	风干牛肉500g大片	0		procure_in	2	7	9	CGRK202603311529	采购入库审核	2026-03-31 15:25:49.295948
222	981	烤奶皮	0		procure_in	10	70	80	CGRK202603313499	采购入库审核	2026-03-31 15:25:51.315827
223	866	酸奶/纯净	0		procure_in	10	0	10	CGRK202603314814	采购入库审核	2026-03-31 15:25:55.706862
224	865	牛肉干/和希格图	0		procure_in	20	0	20	CGRK202603313723	采购入库审核	2026-03-31 15:25:57.895098
225	920	手工乌日末液体	0		procure_in	10	50	60	CGRK202603312715	采购入库审核	2026-03-31 15:26:00.12819
226	970	热奶豆腐碗	0		procure_in	36	0	36	CGRK202603312715	采购入库审核	2026-03-31 15:26:00.136297
227	939	半成品/透明/原味/鲜奶酪	0		procure_in	20	0	20	CGRK202603312715	采购入库审核	2026-03-31 15:26:00.142951
228	940	半成品/透明/甜味/鲜奶酪	0		procure_in	52	0	52	CGRK202603312715	采购入库审核	2026-03-31 15:26:00.149285
229	944	半成品/透明/奶皮千层	0		procure_in	21	0	21	CGRK202603316444	采购入库审核	2026-03-31 15:26:02.425215
230	885	冻炒米/散装	0		procure_in	10	0	10	CGRK202603316444	采购入库审核	2026-03-31 15:26:02.435125
231	863	冻炒米/小包散/精品	0		procure_in	100	0	100	CGRK202603316444	采购入库审核	2026-03-31 15:26:02.443542
232	918	黄油/半斤	0		procure_in	5	0	5	CGRK202603316006	采购入库审核	2026-03-31 15:26:04.520874
233	919	黄油/斤	0		procure_in	5	0	5	CGRK202603316006	采购入库审核	2026-03-31 15:26:04.526693
234	885	冻炒米/散装	0		procure_in	10	10	20	CGRK202603316006	采购入库审核	2026-03-31 15:26:04.532816
235	870	大青砖茶砖	0		procure_in	1	0	1	CGRK202603312281	采购入库审核	2026-03-31 15:26:06.699607
236	871	小青砖茶砖	0		procure_in	1	0	1	CGRK202603312281	采购入库审核	2026-03-31 15:26:06.713608
237	869	青砖碎茶	0		procure_in	1	0	1	CGRK202603312281	采购入库审核	2026-03-31 15:26:06.725784
238	867	5g/青砖袋泡茶	0		procure_in	1	0	1	CGRK202603312281	采购入库审核	2026-03-31 15:26:06.767951
239	868	16g青砖袋泡茶	0		procure_in	1	0	1	CGRK202603312281	采购入库审核	2026-03-31 15:26:06.778508
240	878	羊奶粉/1斤	0		procure_in	6	0	6	CGRK202603317078	采购入库审核	2026-03-31 15:26:09.056395
241	921	嚼口脆炒米糖/散装	0		procure_in	5	25	30	CGRK202603315913	采购入库审核	2026-03-31 15:26:13.453895
242	884	实惠/奶豆腐	0		procure_in	9	0	9	CGRK202603313988	采购入库审核	2026-03-31 15:26:15.675339
243	920	手工乌日末液体	0		procure_in	10	60	70	CGRK202603313988	采购入库审核	2026-03-31 15:26:15.684876
244	880	阿润月饼/五仁馅	0		procure_in	4	10	14	CGRK202603313167	采购入库审核	2026-03-31 15:26:18.560271
245	879	干肉奶茶	0		procure_in	4	10	14	CGRK202603313167	采购入库审核	2026-03-31 15:26:18.566874
246	881	阿润月饼/奶皮子馅	0		procure_in	4	0	4	CGRK202603313167	采购入库审核	2026-03-31 15:26:18.573297
247	882	阿润月饼/黄油渣馅	0		procure_in	4	5	9	CGRK202603313167	采购入库审核	2026-03-31 15:26:18.579694
248	883	阿润月饼/奶豆腐馅	0		procure_in	4	0	4	CGRK202603313167	采购入库审核	2026-03-31 15:26:18.585427
249	946	半成品/透明/鲜奶皮	0		procure_in	40	0	40	CGRK202603313660	采购入库审核	2026-03-31 15:26:20.724083
250	945	半成品/透明/奶皮卷	0		procure_in	50	0	50	CGRK202603313660	采购入库审核	2026-03-31 15:26:20.73309
251	944	半成品/透明/奶皮千层	0		procure_in	20	21	41	CGRK202603313660	采购入库审核	2026-03-31 15:26:20.746089
252	974	纯净黄油/瓶装好的	0		procure_in	35	0	35	CGRK202603313660	采购入库审核	2026-03-31 15:26:20.755197
253	899	纯净/黄油/斤	0		procure_in	10	0	10	CGRK202603313660	采购入库审核	2026-03-31 15:26:20.764141
254	920	手工乌日末液体	0		procure_in	4	70	74	CGRK202603313660	采购入库审核	2026-03-31 15:26:20.773742
255	968	大/奶皮	0		procure_in	30	0	30	CGRK202603313660	采购入库审核	2026-03-31 15:26:20.782867
256	1024	标签/不干胶/奶条/甜味	0		procure_in	500	0	500	CGRK202603316909	采购入库审核	2026-03-31 15:26:23.024116
257	898	透专标签/奶皮千层	0		procure_in	500	0	500	CGRK202603313318	采购入库审核	2026-03-31 15:26:25.29134
258	983	甜味/标签/不干胶/传统奶豆腐	0		procure_in	500	0	500	CGRK202603312826	采购入库审核	2026-03-31 15:26:27.428066
259	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	500	0	500	CGRK202603312826	采购入库审核	2026-03-31 15:26:27.436675
260	884	实惠/奶豆腐	0		procure_in	9	9	18	CGRK202603313621	采购入库审核	2026-03-31 15:26:29.639927
261	920	手工乌日末液体	0		procure_in	10	74	84	CGRK202603313621	采购入库审核	2026-03-31 15:26:29.648675
262	880	阿润月饼/五仁馅	0		procure_in	4	14	18	CGRK202603319433	采购入库审核	2026-03-31 15:26:31.732961
263	879	干肉奶茶	0		procure_in	4	14	18	CGRK202603319433	采购入库审核	2026-03-31 15:26:31.742484
264	881	阿润月饼/奶皮子馅	0		procure_in	4	4	8	CGRK202603319433	采购入库审核	2026-03-31 15:26:31.751978
265	882	阿润月饼/黄油渣馅	0		procure_in	4	9	13	CGRK202603319433	采购入库审核	2026-03-31 15:26:31.763016
266	883	阿润月饼/奶豆腐馅	0		procure_in	4	4	8	CGRK202603319433	采购入库审核	2026-03-31 15:26:31.774061
267	946	半成品/透明/鲜奶皮	0		procure_in	40	40	80	CGRK202603312735	采购入库审核	2026-03-31 15:26:33.733822
268	945	半成品/透明/奶皮卷	0		procure_in	50	50	100	CGRK202603312735	采购入库审核	2026-03-31 15:26:33.742974
269	944	半成品/透明/奶皮千层	0		procure_in	20	41	61	CGRK202603312735	采购入库审核	2026-03-31 15:26:33.751815
270	974	纯净黄油/瓶装好的	0		procure_in	35	35	70	CGRK202603312735	采购入库审核	2026-03-31 15:26:33.763391
271	899	纯净/黄油/斤	0		procure_in	10	10	20	CGRK202603312735	采购入库审核	2026-03-31 15:26:33.771891
272	920	手工乌日末液体	0		procure_in	4	84	88	CGRK202603312735	采购入库审核	2026-03-31 15:26:33.780039
273	968	大/奶皮	0		procure_in	30	30	60	CGRK202603312735	采购入库审核	2026-03-31 15:26:33.788678
274	1024	标签/不干胶/奶条/甜味	0		procure_in	500	500	1000	CGRK202603312169	采购入库审核	2026-03-31 15:26:35.896317
275	889	奶皮卷/科尔沁	0		procure_in	10	0	10	CGRK202603315278	采购入库审核	2026-03-31 15:26:38.08569
276	889	奶皮卷/科尔沁	0		procure_in	10	10	20	CGRK202603312674	采购入库审核	2026-03-31 15:26:40.213157
277	945	半成品/透明/奶皮卷	0		procure_in	25	100	125	CGRK202603312304	采购入库审核	2026-03-31 15:26:42.447536
278	945	半成品/透明/奶皮卷	0		procure_in	25	125	150	CGRK202603312506	采购入库审核	2026-03-31 15:26:44.586308
279	890	红枣	0		procure_in	12	0	12	CGRK202603313188	采购入库审核	2026-03-31 15:26:52.244
280	973	精品/奶豆腐块儿/甜味/	0		procure_in	17	0	17	CGRK202603314149	采购入库审核	2026-03-31 15:26:54.31956
281	986	精品/奶豆腐块儿/原味	0		procure_in	50	0	50	CGRK202603314149	采购入库审核	2026-03-31 15:26:54.328442
282	916	脆奶条/散装/科尔沁	0		procure_in	20	20	40	CGRK202603315580	采购入库审核	2026-03-31 15:26:56.638628
283	889	奶皮卷/科尔沁	0		procure_in	7	20	27	CGRK202603315580	采购入库审核	2026-03-31 15:26:56.647426
284	886	冻炒米/科尔沁	0		procure_in	2	0	2	CGRK202603315580	采购入库审核	2026-03-31 15:26:56.656309
285	887	羊乳奶粉/奶茶专用	0		procure_in	4	0	4	CGRK202603315580	采购入库审核	2026-03-31 15:26:56.66457
286	888	河套奶粉	0		procure_in	4	0	4	CGRK202603315580	采购入库审核	2026-03-31 15:26:56.673573
287	890	红枣	0		procure_in	12	12	24	CGRK202603319636	采购入库审核	2026-03-31 15:26:58.887155
288	973	精品/奶豆腐块儿/甜味/	0		procure_in	17	17	34	CGRK202603315779	采购入库审核	2026-03-31 15:27:01.510682
289	986	精品/奶豆腐块儿/原味	0		procure_in	50	50	100	CGRK202603315779	采购入库审核	2026-03-31 15:27:01.519557
290	916	脆奶条/散装/科尔沁	0		procure_in	20	40	60	CGRK202603314619	采购入库审核	2026-03-31 15:27:03.661728
291	889	奶皮卷/科尔沁	0		procure_in	7	27	34	CGRK202603314619	采购入库审核	2026-03-31 15:27:03.670466
292	886	冻炒米/科尔沁	0		procure_in	2	2	4	CGRK202603314619	采购入库审核	2026-03-31 15:27:03.681678
293	887	羊乳奶粉/奶茶专用	0		procure_in	4	4	8	CGRK202603314619	采购入库审核	2026-03-31 15:27:03.690744
294	888	河套奶粉	0		procure_in	4	4	8	CGRK202603314619	采购入库审核	2026-03-31 15:27:03.709057
295	1014	散装/甜味奶条	0		procure_in	23	0	23	CGRK202603314424	采购入库审核	2026-03-31 15:27:05.80681
296	1015	散装/原味奶条	0		procure_in	12	0	12	CGRK202603311843	采购入库审核	2026-03-31 15:27:08.001378
297	1014	散装/甜味奶条	0		procure_in	23	23	46	CGRK202603314244	采购入库审核	2026-03-31 15:27:10.246239
298	1015	散装/原味奶条	0		procure_in	12	12	24	CGRK202603317384	采购入库审核	2026-03-31 15:27:12.470276
299	902	乌日莫糖/散装	0		procure_in	5	10	15	CGRK202603313871	采购入库审核	2026-03-31 15:27:14.653117
300	921	嚼口脆炒米糖/散装	0		procure_in	5	30	35	CGRK202603313871	采购入库审核	2026-03-31 15:27:14.66289
301	922	酸奶炒米糖/散装	0		procure_in	5	10	15	CGRK202603313871	采购入库审核	2026-03-31 15:27:14.672183
302	891	芝士奶豆腐月饼	0		procure_in	10	0	10	CGRK202603316826	采购入库审核	2026-03-31 15:27:16.798505
303	893	奶豆腐月饼	0		procure_in	10	0	10	CGRK202603316826	采购入库审核	2026-03-31 15:27:16.80726
304	892	那牧尔酸奶	0		procure_in	10	0	10	CGRK202603316826	采购入库审核	2026-03-31 15:27:16.81577
305	895	黄油渣月饼	0		procure_in	10	0	10	CGRK202603316826	采购入库审核	2026-03-31 15:27:16.824179
306	896	奶皮月饼	0		procure_in	10	0	10	CGRK202603316826	采购入库审核	2026-03-31 15:27:16.832756
307	897	早餐包/那牧尔	0		procure_in	10	0	10	CGRK202603316826	采购入库审核	2026-03-31 15:27:16.860775
308	894	酸奶月饼	0		procure_in	10	0	10	CGRK202603316826	采购入库审核	2026-03-31 15:27:16.869391
309	902	乌日莫糖/散装	0		procure_in	5	15	20	CGRK202603313985	采购入库审核	2026-03-31 15:27:18.963064
310	921	嚼口脆炒米糖/散装	0		procure_in	5	35	40	CGRK202603313985	采购入库审核	2026-03-31 15:27:18.972087
311	922	酸奶炒米糖/散装	0		procure_in	5	15	20	CGRK202603313985	采购入库审核	2026-03-31 15:27:18.981189
312	891	芝士奶豆腐月饼	0		procure_in	10	10	20	CGRK202603315807	采购入库审核	2026-03-31 15:27:20.971694
313	893	奶豆腐月饼	0		procure_in	10	10	20	CGRK202603315807	采购入库审核	2026-03-31 15:27:20.981175
314	892	那牧尔酸奶	0		procure_in	10	10	20	CGRK202603315807	采购入库审核	2026-03-31 15:27:20.990127
315	895	黄油渣月饼	0		procure_in	10	10	20	CGRK202603315807	采购入库审核	2026-03-31 15:27:20.999407
316	896	奶皮月饼	0		procure_in	10	10	20	CGRK202603315807	采购入库审核	2026-03-31 15:27:21.00811
317	897	早餐包/那牧尔	0		procure_in	10	10	20	CGRK202603315807	采购入库审核	2026-03-31 15:27:21.017439
318	894	酸奶月饼	0		procure_in	10	10	20	CGRK202603315807	采购入库审核	2026-03-31 15:27:21.02681
321	920	手工乌日末液体	0		procure_in	10	98	108	CGRK202603311412	采购入库审核	2026-03-31 15:27:25.843967
322	917	机器乌日末液体	0		procure_in	4	4	8	CGRK202603311412	采购入库审核	2026-03-31 15:27:25.853094
325	1013	冻炒米/给组装半成品/那牧尔	0		procure_in	100	0	100	CGRK202603317749	采购入库审核	2026-03-31 15:27:30.237199
328	1013	冻炒米/给组装半成品/那牧尔	0		procure_in	100	100	200	CGRK202603315380	采购入库审核	2026-03-31 15:27:34.891325
1453	982	塑料手提袋	0		procure_in	5000	5000	10000	CGRK202603317738	采购入库审核	2026-03-31 16:41:33.49883
1457	991	奶果子/散装	0		procure_in	86	119	205	CGRK202603315015	采购入库审核	2026-03-31 16:41:39.166035
1459	1014	散装/甜味奶条	0		procure_in	21	118	139	CGRK202603317227	采购入库审核	2026-03-31 16:41:43.185889
1461	995	茶专用/热缩膜	0		procure_in	2600	0	2600	CGRK202603314460	采购入库审核	2026-03-31 16:41:47.142438
1463	1001	冷冻柜/冰箱	0		procure_in	1	0	1	CGRK202603317776	采购入库审核	2026-03-31 16:41:52.862762
1464	1019	标签/不干胶/冻炒米	0		procure_in	500	0	500	CGRK202603318283	采购入库审核	2026-03-31 16:41:54.352385
1465	984	茶包/类腰封纸	0		procure_in	2000	0	2000	CGRK202603318283	采购入库审核	2026-03-31 16:41:54.358881
1466	975	黄油脖签	0		procure_in	500	0	500	CGRK202603318283	采购入库审核	2026-03-31 16:41:54.364718
1467	978	新茶专用标签纸	0		procure_in	3000	0	3000	CGRK202603318283	采购入库审核	2026-03-31 16:41:54.370677
1471	1019	标签/不干胶/冻炒米	0		procure_in	500	500	1000	CGRK202603317281	采购入库审核	2026-03-31 16:41:58.936956
1472	984	茶包/类腰封纸	0		procure_in	2000	2000	4000	CGRK202603317281	采购入库审核	2026-03-31 16:41:58.943407
1473	975	黄油脖签	0		procure_in	500	500	1000	CGRK202603317281	采购入库审核	2026-03-31 16:41:58.949687
1474	978	新茶专用标签纸	0		procure_in	3000	3000	6000	CGRK202603317281	采购入库审核	2026-03-31 16:41:58.955009
1478	1010	奶油球	0		procure_in	10	40	50	CGRK202603314211	采购入库审核	2026-03-31 16:42:03.279657
1479	997	茶专用/盐包	0		procure_in	8	10	18	CGRK202603312404	采购入库审核	2026-03-31 16:42:04.936683
1483	997	茶专用/盐包	0		procure_in	3560	18	3578	CGRK202603319814	采购入库审核	2026-03-31 16:42:07.863731
1485	1010	奶油球	0		procure_in	10	50	60	CGRK202603315724	采购入库审核	2026-03-31 16:42:11.225564
1486	987	采购样品专用/乳制品	0		procure_in	14	0	14	CGRK202603312742	采购入库审核	2026-03-31 16:42:13.942434
1489	1015	散装/原味奶条	0		procure_in	9	102	111	CGRK202603312582	采购入库审核	2026-03-31 16:42:18.763229
1491	1014	散装/甜味奶条	0		procure_in	16	139	155	CGRK202603317649	采购入库审核	2026-03-31 16:42:22.535871
1492	1014	散装/甜味奶条	0		procure_in	10	155	165	CGRK202603317649	采购入库审核	2026-03-31 16:42:22.541705
1494	1009	专盒/青砖奶茶外盒	0		procure_in	3030	0	3030	CGRK202603317409	采购入库审核	2026-03-31 16:42:26.044379
1498	997	茶专用/盐包	0		procure_in	2	3578	3580	CGRK202603314744	采购入库审核	2026-03-31 16:42:32.548712
1499	997	茶专用/盐包	0		procure_in	200	3580	3780	CGRK202603314744	采购入库审核	2026-03-31 16:42:32.554533
1502	998	茶专用/硫酸纸	0		procure_in	1000	0	1000	CGRK202603315535	采购入库审核	2026-03-31 16:42:36.781691
1503	999	茶专用/不干胶/标签	0		procure_in	1000	120	1120	CGRK202603315535	采购入库审核	2026-03-31 16:42:36.790246
1505	1009	专盒/青砖奶茶外盒	0		procure_in	200	3030	3230	CGRK202603318063	采购入库审核	2026-03-31 16:42:40.086344
1507	991	奶果子/散装	0		procure_in	18	291	309	CGRK202603318731	采购入库审核	2026-03-31 16:42:44.068665
1510	1033	专袋/奶条	0		procure_in	51	0	51	CGRK202603318453	采购入库审核	2026-03-31 16:42:51.093309
1511	1033	专袋/奶条	0		procure_in	84	51	135	CGRK202603318453	采购入库审核	2026-03-31 16:42:51.099484
1512	1033	专袋/奶条	0		procure_in	2	135	137	CGRK202603318453	采购入库审核	2026-03-31 16:42:51.105862
1513	1033	专袋/奶条	0		procure_in	48	137	185	CGRK202603318453	采购入库审核	2026-03-31 16:42:51.1117
1515	1031	专底盒/奶条	0		procure_in	30	0	30	CGRK202603319931	采购入库审核	2026-03-31 16:42:56.206122
1516	1031	专底盒/奶条	0		procure_in	3	30	33	CGRK202603319931	采购入库审核	2026-03-31 16:42:56.212117
1519	1028	专标签/黄油	0		procure_in	16	0	16	CGRK202603318955	采购入库审核	2026-03-31 16:43:00.678674
1521	1026	专内袋/奶果子	0		procure_in	16	0	16	CGRK202603318147	采购入库审核	2026-03-31 16:43:04.537967
1522	1026	专内袋/奶果子	0		procure_in	13	16	29	CGRK202603318147	采购入库审核	2026-03-31 16:43:04.543136
1525	1024	标签/不干胶/奶条/甜味	0		procure_in	77	1000	1077	CGRK202603318548	采购入库审核	2026-03-31 16:43:08.035525
1526	1023	标签/不干胶/奶条/原味	0		procure_in	27	0	27	CGRK202603318548	采购入库审核	2026-03-31 16:43:08.041433
1528	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	14	550	564	CGRK202603314892	采购入库审核	2026-03-31 16:43:11.594694
1529	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	15	564	579	CGRK202603314892	采购入库审核	2026-03-31 16:43:11.601166
1533	1018	礼盒/蓝界	0		procure_in	30	0	30	CGRK202603318644	采购入库审核	2026-03-31 16:43:17.433337
1534	1018	礼盒/蓝界	0		procure_in	26	30	56	CGRK202603318644	采购入库审核	2026-03-31 16:43:17.438958
1542	1033	专袋/奶条	0		procure_in	17	376	393	CGRK202603319881	采购入库审核	2026-03-31 16:43:21.563783
1543	1033	专袋/奶条	0		procure_in	16	393	409	CGRK202603319881	采购入库审核	2026-03-31 16:43:21.570539
1544	1033	专袋/奶条	0		procure_in	47	409	456	CGRK202603319881	采购入库审核	2026-03-31 16:43:21.576712
1545	1033	专袋/奶条	0		procure_in	7	456	463	CGRK202603319881	采购入库审核	2026-03-31 16:43:21.582492
1546	1031	专底盒/奶条	0		procure_in	79	74	153	CGRK202603319881	采购入库审核	2026-03-31 16:43:21.589171
1547	1031	专底盒/奶条	0		procure_in	33	153	186	CGRK202603319881	采购入库审核	2026-03-31 16:43:21.595441
1548	1030	专外盒/奶果子	0		procure_in	6	6	12	CGRK202603319881	采购入库审核	2026-03-31 16:43:21.60133
1549	1030	专外盒/奶果子	0		procure_in	34	12	46	CGRK202603319881	采购入库审核	2026-03-31 16:43:21.606725
1550	1029	专内盒/奶果子	0		procure_in	24	8	32	CGRK202603319881	采购入库审核	2026-03-31 16:43:21.61339
1551	1029	专内盒/奶果子	0		procure_in	37	32	69	CGRK202603319881	采购入库审核	2026-03-31 16:43:21.618693
319	920	手工乌日末液体	0		procure_in	10	88	98	CGRK202603315838	采购入库审核	2026-03-31 15:27:23.171029
320	917	机器乌日末液体	0		procure_in	4	0	4	CGRK202603315838	采购入库审核	2026-03-31 15:27:23.179891
323	899	纯净/黄油/斤	0		procure_in	6	20	26	CGRK202603316842	采购入库审核	2026-03-31 15:27:28.125796
324	945	半成品/透明/奶皮卷	0		procure_in	10	150	160	CGRK202603316842	采购入库审核	2026-03-31 15:27:28.135061
326	899	纯净/黄油/斤	0		procure_in	6	26	32	CGRK202603313127	采购入库审核	2026-03-31 15:27:32.479658
327	945	半成品/透明/奶皮卷	0		procure_in	10	160	170	CGRK202603313127	采购入库审核	2026-03-31 15:27:32.488948
329	901	手工白花炒米/散装	0		procure_in	30	60	90	CGRK202603314294	采购入库审核	2026-03-31 15:27:37.197058
330	902	乌日莫糖/散装	0		procure_in	5	20	25	CGRK202603314294	采购入库审核	2026-03-31 15:27:37.205975
331	915	黄油渣/盒	0		procure_in	4	0	4	CGRK202603314294	采购入库审核	2026-03-31 15:27:37.214322
332	981	烤奶皮	0		procure_in	10	80	90	CGRK202603314294	采购入库审核	2026-03-31 15:27:37.223021
333	1013	冻炒米/给组装半成品/那牧尔	0		procure_in	100	200	300	CGRK202603318659	采购入库审核	2026-03-31 15:27:42.580331
334	900	透专标签/脆香奶条/微甜	0		procure_in	500	0	500	CGRK202603319871	采购入库审核	2026-03-31 15:27:45.569911
335	950	透专标签/奶皮卷	0		procure_in	500	0	500	CGRK202603319871	采购入库审核	2026-03-31 15:27:45.578359
336	951	透专标签/冻炒米	0		procure_in	500	0	500	CGRK202603319871	采购入库审核	2026-03-31 15:27:45.587129
337	952	透专标签/奶酪/原味	0		procure_in	500	0	500	CGRK202603319871	采购入库审核	2026-03-31 15:27:45.597286
338	953	透专标签/奶酪/甜味	0		procure_in	500	0	500	CGRK202603319871	采购入库审核	2026-03-31 15:27:45.606272
339	956	透专标签/鲜奶皮	0		procure_in	500	0	500	CGRK202603319871	采购入库审核	2026-03-31 15:27:45.615339
340	1010	奶油球	0		procure_in	20	0	20	CGRK202603316302	采购入库审核	2026-03-31 15:27:49.784575
341	929	白砂糖	0		procure_in	6	0	6	CGRK202603314799	采购入库审核	2026-03-31 15:27:52.055486
342	901	手工白花炒米/散装	0		procure_in	30	90	120	CGRK202603316269	采购入库审核	2026-03-31 15:27:54.535492
343	902	乌日莫糖/散装	0		procure_in	5	25	30	CGRK202603316269	采购入库审核	2026-03-31 15:27:54.544817
344	915	黄油渣/盒	0		procure_in	4	4	8	CGRK202603316269	采购入库审核	2026-03-31 15:27:54.553849
345	981	烤奶皮	0		procure_in	10	90	100	CGRK202603316269	采购入库审核	2026-03-31 15:27:54.563492
346	1013	冻炒米/给组装半成品/那牧尔	0		procure_in	100	300	400	CGRK202603314722	采购入库审核	2026-03-31 15:27:59.721893
347	900	透专标签/脆香奶条/微甜	0		procure_in	500	500	1000	CGRK202603315560	采购入库审核	2026-03-31 15:28:02.008402
348	950	透专标签/奶皮卷	0		procure_in	500	500	1000	CGRK202603315560	采购入库审核	2026-03-31 15:28:02.01734
349	951	透专标签/冻炒米	0		procure_in	500	500	1000	CGRK202603315560	采购入库审核	2026-03-31 15:28:02.026616
350	952	透专标签/奶酪/原味	0		procure_in	500	500	1000	CGRK202603315560	采购入库审核	2026-03-31 15:28:02.035746
351	953	透专标签/奶酪/甜味	0		procure_in	500	500	1000	CGRK202603315560	采购入库审核	2026-03-31 15:28:02.045259
352	956	透专标签/鲜奶皮	0		procure_in	500	500	1000	CGRK202603315560	采购入库审核	2026-03-31 15:28:02.054185
353	1010	奶油球	0		procure_in	20	20	40	CGRK202603317292	采购入库审核	2026-03-31 15:28:04.373788
354	929	白砂糖	0		procure_in	6	6	12	CGRK202603314637	采购入库审核	2026-03-31 15:28:07.808274
355	923	炒米/散装/硬口	0		procure_in	1	32	33	CGRK202603311073	采购入库审核	2026-03-31 15:28:10.250667
356	922	酸奶炒米糖/散装	0		procure_in	1	20	21	CGRK202603315061	采购入库审核	2026-03-31 15:28:12.549652
357	921	嚼口脆炒米糖/散装	0		procure_in	1	40	41	CGRK202603315061	采购入库审核	2026-03-31 15:28:12.55917
358	907	风干牛肉500g大片	0		procure_in	2	9	11	CGRK202603316985	采购入库审核	2026-03-31 15:28:16.160894
359	908	哈斯乌拉牛肉干500g原味	0		procure_in	2	15	17	CGRK202603316985	采购入库审核	2026-03-31 15:28:16.170122
360	909	蓝旗绿乳糖惠虹糖	0		procure_in	2	0	2	CGRK202603316985	采购入库审核	2026-03-31 15:28:16.179261
361	910	蓝旗绿乳糖奶香酥	0		procure_in	2	0	2	CGRK202603316985	采购入库审核	2026-03-31 15:28:16.188066
362	911	蓝旗绿乳糖果仁酥	0		procure_in	2	0	2	CGRK202603316985	采购入库审核	2026-03-31 15:28:16.197371
363	912	蓝旗绿乳糖水果	0		procure_in	2	0	2	CGRK202603316985	采购入库审核	2026-03-31 15:28:16.20682
364	913	蓝旗绿乳糖黄油球	0		procure_in	2	0	2	CGRK202603316985	采购入库审核	2026-03-31 15:28:16.215974
365	914	蓝旗绿乳糖炼乳	0		procure_in	2	0	2	CGRK202603316985	采购入库审核	2026-03-31 15:28:16.224834
366	921	嚼口脆炒米糖/散装	0		procure_in	1	41	42	CGRK202603316985	采购入库审核	2026-03-31 15:28:16.233885
367	922	酸奶炒米糖/散装	0		procure_in	1	21	22	CGRK202603316985	采购入库审核	2026-03-31 15:28:16.259073
368	915	黄油渣/盒	0		procure_in	4	8	12	CGRK202603316985	采购入库审核	2026-03-31 15:28:16.268756
369	916	脆奶条/散装/科尔沁	0		procure_in	10	60	70	CGRK202603316985	采购入库审核	2026-03-31 15:28:16.277989
370	905	真空奶豆腐砖/甜味	0		procure_in	2	0	2	CGRK202603316985	采购入库审核	2026-03-31 15:28:16.28749
371	906	真空奶豆腐砖/原味	0		procure_in	2	0	2	CGRK202603316985	采购入库审核	2026-03-31 15:28:16.297425
372	903	盛宇燃奶豆腐/甜味	0		procure_in	2	13	15	CGRK202603316985	采购入库审核	2026-03-31 15:28:16.361218
373	904	盛宇燃奶豆腐/原味	0		procure_in	2	14	16	CGRK202603316985	采购入库审核	2026-03-31 15:28:16.370839
374	923	炒米/散装/硬口	0		procure_in	1	33	34	CGRK202603317247	采购入库审核	2026-03-31 15:28:18.67123
375	922	酸奶炒米糖/散装	0		procure_in	1	22	23	CGRK202603318149	采购入库审核	2026-03-31 15:28:21.42246
376	921	嚼口脆炒米糖/散装	0		procure_in	1	42	43	CGRK202603318149	采购入库审核	2026-03-31 15:28:21.431831
377	907	风干牛肉500g大片	0		procure_in	2	11	13	CGRK202603312692	采购入库审核	2026-03-31 15:28:23.596785
378	908	哈斯乌拉牛肉干500g原味	0		procure_in	2	17	19	CGRK202603312692	采购入库审核	2026-03-31 15:28:23.606544
379	909	蓝旗绿乳糖惠虹糖	0		procure_in	2	2	4	CGRK202603312692	采购入库审核	2026-03-31 15:28:23.663919
380	910	蓝旗绿乳糖奶香酥	0		procure_in	2	2	4	CGRK202603312692	采购入库审核	2026-03-31 15:28:23.673087
381	911	蓝旗绿乳糖果仁酥	0		procure_in	2	2	4	CGRK202603312692	采购入库审核	2026-03-31 15:28:23.681972
382	912	蓝旗绿乳糖水果	0		procure_in	2	2	4	CGRK202603312692	采购入库审核	2026-03-31 15:28:23.691189
383	913	蓝旗绿乳糖黄油球	0		procure_in	2	2	4	CGRK202603312692	采购入库审核	2026-03-31 15:28:23.700078
384	914	蓝旗绿乳糖炼乳	0		procure_in	2	2	4	CGRK202603312692	采购入库审核	2026-03-31 15:28:23.709335
385	921	嚼口脆炒米糖/散装	0		procure_in	1	43	44	CGRK202603312692	采购入库审核	2026-03-31 15:28:23.718445
386	922	酸奶炒米糖/散装	0		procure_in	1	23	24	CGRK202603312692	采购入库审核	2026-03-31 15:28:23.727148
387	915	黄油渣/盒	0		procure_in	4	12	16	CGRK202603312692	采购入库审核	2026-03-31 15:28:23.736465
388	916	脆奶条/散装/科尔沁	0		procure_in	10	70	80	CGRK202603312692	采购入库审核	2026-03-31 15:28:23.745593
389	905	真空奶豆腐砖/甜味	0		procure_in	2	2	4	CGRK202603312692	采购入库审核	2026-03-31 15:28:23.754221
390	906	真空奶豆腐砖/原味	0		procure_in	2	2	4	CGRK202603312692	采购入库审核	2026-03-31 15:28:23.763913
391	903	盛宇燃奶豆腐/甜味	0		procure_in	2	15	17	CGRK202603312692	采购入库审核	2026-03-31 15:28:23.773431
392	904	盛宇燃奶豆腐/原味	0		procure_in	2	16	18	CGRK202603312692	采购入库审核	2026-03-31 15:28:23.781817
393	924	冻炒米/袋装	0		procure_in	5	0	5	CGRK202603312165	采购入库审核	2026-03-31 15:28:26.160999
394	917	机器乌日末液体	0		procure_in	2	8	10	CGRK202603312165	采购入库审核	2026-03-31 15:28:26.17006
395	920	手工乌日末液体	0		procure_in	10	108	118	CGRK202603312165	采购入库审核	2026-03-31 15:28:26.178916
396	918	黄油/半斤	0		procure_in	2	5	7	CGRK202603312165	采购入库审核	2026-03-31 15:28:26.188629
397	919	黄油/斤	0		procure_in	4	5	9	CGRK202603312165	采购入库审核	2026-03-31 15:28:26.19805
398	873	专袋/牛肉干包装	0		procure_in	3000	0	3000	CGRK202603317882	采购入库审核	2026-03-31 15:28:28.964579
399	924	冻炒米/袋装	0		procure_in	5	5	10	CGRK202603317772	采购入库审核	2026-03-31 15:28:31.155103
400	917	机器乌日末液体	0		procure_in	2	10	12	CGRK202603317772	采购入库审核	2026-03-31 15:28:31.165637
401	920	手工乌日末液体	0		procure_in	10	118	128	CGRK202603317772	采购入库审核	2026-03-31 15:28:31.176013
402	918	黄油/半斤	0		procure_in	2	7	9	CGRK202603317772	采购入库审核	2026-03-31 15:28:31.185967
403	919	黄油/斤	0		procure_in	4	9	13	CGRK202603317772	采购入库审核	2026-03-31 15:28:31.19527
404	949	专袋/乌日莫/炒米	0		procure_in	100	0	100	CGRK202603315624	采购入库审核	2026-03-31 15:28:33.606914
405	948	专袋/乌日莫	0		procure_in	100	0	100	CGRK202603315624	采购入库审核	2026-03-31 15:28:33.615432
406	1013	冻炒米/给组装半成品/那牧尔	0		procure_in	40	400	440	CGRK202603318027	采购入库审核	2026-03-31 15:28:35.764608
407	930	加沙奶豆腐	0		procure_in	5	0	5	CGRK202603318023	采购入库审核	2026-03-31 15:28:38.132326
408	931	炒米粉/aag	0		procure_in	10	20	30	CGRK202603318023	采购入库审核	2026-03-31 15:28:38.143453
409	932	炒米海丰	0		procure_in	10	20	30	CGRK202603318023	采购入库审核	2026-03-31 15:28:38.157167
410	929	白砂糖	0		procure_in	2	12	14	CGRK202603317210	采购入库审核	2026-03-31 15:28:40.374764
411	1002	封口机/真空	0		procure_in	1	0	1	CGRK202603317210	采购入库审核	2026-03-31 15:28:40.384071
412	928	塑料购物袋	0		procure_in	300	0	300	CGRK202603317210	采购入库审核	2026-03-31 15:28:40.393768
413	926	大奶豆腐砖/1.2斤	0		procure_in	19	0	19	CGRK202603313193	采购入库审核	2026-03-31 15:28:42.611767
414	927	小奶豆腐砖/1斤	0		procure_in	20	0	20	CGRK202603313193	采购入库审核	2026-03-31 15:28:42.621681
415	925	小/无印花/奶豆腐砖/1斤	0		procure_in	20	0	20	CGRK202603313193	采购入库审核	2026-03-31 15:28:42.630782
416	946	半成品/透明/鲜奶皮	0		procure_in	29	80	109	CGRK202603313193	采购入库审核	2026-03-31 15:28:42.639094
417	945	半成品/透明/奶皮卷	0		procure_in	6	170	176	CGRK202603313193	采购入库审核	2026-03-31 15:28:42.650974
418	939	半成品/透明/原味/鲜奶酪	0		procure_in	40	20	60	CGRK202603313193	采购入库审核	2026-03-31 15:28:42.660698
419	940	半成品/透明/甜味/鲜奶酪	0		procure_in	40	52	92	CGRK202603313193	采购入库审核	2026-03-31 15:28:42.669561
420	949	专袋/乌日莫/炒米	0		procure_in	100	100	200	CGRK202603311851	采购入库审核	2026-03-31 15:28:44.879471
421	948	专袋/乌日莫	0		procure_in	100	100	200	CGRK202603311851	采购入库审核	2026-03-31 15:28:44.888329
422	1013	冻炒米/给组装半成品/那牧尔	0		procure_in	40	440	480	CGRK202603316103	采购入库审核	2026-03-31 15:28:47.197798
423	930	加沙奶豆腐	0		procure_in	5	5	10	CGRK202603313573	采购入库审核	2026-03-31 15:28:49.588894
424	931	炒米粉/aag	0		procure_in	10	30	40	CGRK202603313573	采购入库审核	2026-03-31 15:28:49.59886
425	932	炒米海丰	0		procure_in	10	30	40	CGRK202603313573	采购入库审核	2026-03-31 15:28:49.608808
426	929	白砂糖	0		procure_in	2	14	16	CGRK202603314923	采购入库审核	2026-03-31 15:28:52.683756
427	1002	封口机/真空	0		procure_in	1	1	2	CGRK202603314923	采购入库审核	2026-03-31 15:28:52.692981
428	928	塑料购物袋	0		procure_in	300	300	600	CGRK202603314923	采购入库审核	2026-03-31 15:28:52.702121
429	926	大奶豆腐砖/1.2斤	0		procure_in	19	19	38	CGRK202603316519	采购入库审核	2026-03-31 15:28:54.818087
430	927	小奶豆腐砖/1斤	0		procure_in	20	20	40	CGRK202603316519	采购入库审核	2026-03-31 15:28:54.833533
431	925	小/无印花/奶豆腐砖/1斤	0		procure_in	20	20	40	CGRK202603316519	采购入库审核	2026-03-31 15:28:54.843919
432	946	半成品/透明/鲜奶皮	0		procure_in	29	109	138	CGRK202603316519	采购入库审核	2026-03-31 15:28:54.852799
433	945	半成品/透明/奶皮卷	0		procure_in	6	176	182	CGRK202603316519	采购入库审核	2026-03-31 15:28:54.863131
434	939	半成品/透明/原味/鲜奶酪	0		procure_in	40	60	100	CGRK202603316519	采购入库审核	2026-03-31 15:28:54.871746
435	940	半成品/透明/甜味/鲜奶酪	0		procure_in	40	92	132	CGRK202603316519	采购入库审核	2026-03-31 15:28:54.882402
436	981	烤奶皮	0		procure_in	7	100	107	CGRK202603312723	采购入库审核	2026-03-31 15:28:57.008488
437	973	精品/奶豆腐块儿/甜味/	0		procure_in	20	34	54	CGRK202603316782	采购入库审核	2026-03-31 15:28:59.167257
438	986	精品/奶豆腐块儿/原味	0		procure_in	20	100	120	CGRK202603316782	采购入库审核	2026-03-31 15:28:59.17651
439	974	纯净黄油/瓶装好的	0		procure_in	32	70	102	CGRK202603316782	采购入库审核	2026-03-31 15:28:59.18569
440	963	小/方形/亚克力盒/	0		procure_in	240	720	960	CGRK202603316560	采购入库审核	2026-03-31 15:29:01.247112
441	962	中/方形/亚克力盒/	0		procure_in	258	0	258	CGRK202603316560	采购入库审核	2026-03-31 15:29:01.256497
442	960	三角/奶皮千层盒	0		procure_in	200	0	200	CGRK202603316560	采购入库审核	2026-03-31 15:29:01.266284
447	979	新茶包/纸	0		procure_in	20000	0	20000	CGRK202603312482	采购入库审核	2026-03-31 15:29:03.732821
443	961	扁盒/亚克力/带内托	0		procure_in	300	0	300	CGRK202603316560	采购入库审核	2026-03-31 15:29:01.277378
444	959	大/牛薄脆盒/亚克力	0		procure_in	246	0	246	CGRK202603316560	采购入库审核	2026-03-31 15:29:01.289448
445	958	小/长方/亚克力/乳清奶条盒	0		procure_in	183	0	183	CGRK202603316560	采购入库审核	2026-03-31 15:29:01.298751
446	957	大/长方/亚克力/待用	0		procure_in	180	0	180	CGRK202603316560	采购入库审核	2026-03-31 15:29:01.307974
456	981	烤奶皮	0		procure_in	7	107	114	CGRK202603317710	采购入库审核	2026-03-31 15:29:05.898689
460	963	小/方形/亚克力盒/	0		procure_in	240	960	1200	CGRK202603318706	采购入库审核	2026-03-31 15:29:10.265374
461	962	中/方形/亚克力盒/	0		procure_in	258	258	516	CGRK202603318706	采购入库审核	2026-03-31 15:29:10.274803
462	960	三角/奶皮千层盒	0		procure_in	200	200	400	CGRK202603318706	采购入库审核	2026-03-31 15:29:10.284666
463	961	扁盒/亚克力/带内托	0		procure_in	300	300	600	CGRK202603318706	采购入库审核	2026-03-31 15:29:10.293805
464	959	大/牛薄脆盒/亚克力	0		procure_in	246	246	492	CGRK202603318706	采购入库审核	2026-03-31 15:29:10.363872
465	958	小/长方/亚克力/乳清奶条盒	0		procure_in	183	183	366	CGRK202603318706	采购入库审核	2026-03-31 15:29:10.459975
466	957	大/长方/亚克力/待用	0		procure_in	180	180	360	CGRK202603318706	采购入库审核	2026-03-31 15:29:10.483988
476	972	原味/散称/奶豆腐块儿	0		procure_in	10	0	10	CGRK202603318436	采购入库审核	2026-03-31 15:29:14.765103
477	971	甜味/散称/奶豆腐块儿	0		procure_in	10	0	10	CGRK202603318436	采购入库审核	2026-03-31 15:29:14.774675
478	965	半成品/透明/冻炒米	0		procure_in	38	0	38	CGRK202603318436	采购入库审核	2026-03-31 15:29:14.783721
479	970	热奶豆腐碗	0		procure_in	50	36	86	CGRK202603318436	采购入库审核	2026-03-31 15:29:14.793021
480	968	大/奶皮	0		procure_in	30	60	90	CGRK202603318436	采购入库审核	2026-03-31 15:29:14.802086
481	969	小/奶皮	0		procure_in	30	0	30	CGRK202603318436	采购入库审核	2026-03-31 15:29:14.812343
482	967	查嘎/乳清	0		procure_in	5	0	5	CGRK202603318436	采购入库审核	2026-03-31 15:29:14.821778
483	966	查嘎粉/小包装袋	0		procure_in	30	0	30	CGRK202603318436	采购入库审核	2026-03-31 15:29:14.830832
492	982	塑料手提袋	0		procure_in	5000	0	5000	CGRK202603316912	采购入库审核	2026-03-31 15:29:19.542817
493	1016	专瓶/黄油	0		procure_in	240	0	240	CGRK202603312940	采购入库审核	2026-03-31 15:29:22.212607
494	862	专瓶/黄油渣	0		procure_in	120	0	120	CGRK202603312940	采购入库审核	2026-03-31 15:29:22.221617
1509	991	奶果子/散装	0		procure_in	14	309	323	CGRK202603313009	采购入库审核	2026-03-31 16:42:48.216877
1514	1032	专盒/冻炒米	0		procure_in	32	0	32	CGRK202603311619	采购入库审核	2026-03-31 16:42:53.811836
1517	1029	专内盒/奶果子	0		procure_in	8	0	8	CGRK202603311805	采购入库审核	2026-03-31 16:42:58.227545
1518	1030	专外盒/奶果子	0		procure_in	6	0	6	CGRK202603311805	采购入库审核	2026-03-31 16:42:58.23395
1520	1027	真空袋	0		procure_in	60	1000	1060	CGRK202603316109	采购入库审核	2026-03-31 16:43:02.693598
1523	1025	定制款/专内袋/扎那家奶果子	0		procure_in	16	0	16	CGRK202603318163	采购入库审核	2026-03-31 16:43:06.140018
1524	1025	定制款/专内袋/扎那家奶果子	0		procure_in	170	16	186	CGRK202603318163	采购入库审核	2026-03-31 16:43:06.146931
1527	1022	专袋/传统奶豆腐	0		procure_in	90	0	90	CGRK202603318109	采购入库审核	2026-03-31 16:43:09.958528
1530	1020	标签/不干胶/奶果子	0		procure_in	13	1000	1013	CGRK202603311132	采购入库审核	2026-03-31 16:43:13.504413
1531	1019	标签/不干胶/冻炒米	0		procure_in	500	1000	1500	CGRK202603318352	采购入库审核	2026-03-31 16:43:15.749392
1532	1032	专盒/冻炒米	0		procure_in	1650	32	1682	CGRK202603318352	采购入库审核	2026-03-31 16:43:15.756409
1535	1017	手提袋	0		procure_in	368	0	368	CGRK202603319888	采购入库审核	2026-03-31 16:43:19.887924
1536	1033	专袋/奶条	0		procure_in	80	185	265	CGRK202603319888	采购入库审核	2026-03-31 16:43:19.894331
1537	1033	专袋/奶条	0		procure_in	20	265	285	CGRK202603319888	采购入库审核	2026-03-31 16:43:19.900346
1538	1033	专袋/奶条	0		procure_in	86	285	371	CGRK202603319888	采购入库审核	2026-03-31 16:43:19.907327
1539	1033	专袋/奶条	0		procure_in	5	371	376	CGRK202603319888	采购入库审核	2026-03-31 16:43:19.913895
1540	1031	专底盒/奶条	0		procure_in	17	33	50	CGRK202603319888	采购入库审核	2026-03-31 16:43:19.920589
1541	1031	专底盒/奶条	0		procure_in	24	50	74	CGRK202603319888	采购入库审核	2026-03-31 16:43:19.927093
1559	1022	专袋/传统奶豆腐	0		procure_in	79	90	169	CGRK202603317845	采购入库审核	2026-03-31 16:43:26.467707
1560	1022	专袋/传统奶豆腐	0		procure_in	23	169	192	CGRK202603317845	采购入库审核	2026-03-31 16:43:26.474698
1562	1016	专瓶/黄油	0		procure_in	55	480	535	CGRK202603312514	采购入库审核	2026-03-31 16:43:29.495505
1635	920	手工乌日末液体	0		procure_in_reverse	-10	98	88	CGRK202603315575	采购入库反审核	2026-04-03 07:15:33.102876
1636	855	奶锅巴/扎旗吉十奶制品	0		procure_in_reverse	-5	5	0	CGRK202603316221	采购入库反审核	2026-04-03 07:15:34.438107
1641	850	红糖袋/delicious	0		procure_in_reverse	-100	100	0	CGRK202603313441	采购入库反审核	2026-04-03 07:15:38.611214
1643	856	科尔沁/大奶豆腐	0		procure_in_reverse	-3	3	0	CGRK202603318248	采购入库反审核	2026-04-03 07:15:41.323546
1644	923	炒米/散装/硬口	0		procure_in_reverse	-1	4	3	CGRK202603318248	采购入库反审核	2026-04-03 07:15:41.33213
1647	981	烤奶皮	0		procure_in_reverse	-10	64	54	CGRK202603314690	采购入库反审核	2026-04-03 07:15:45.43707
1648	901	手工白花炒米/散装	0		procure_in_reverse	-30	90	60	CGRK202603314690	采购入库反审核	2026-04-03 07:15:45.447427
1652	1011	茶包	0		procure_in_reverse	-10	18	8	CGRK202603319187	采购入库反审核	2026-04-03 07:15:49.514424
1653	920	手工乌日末液体	0		procure_in_reverse	-10	88	78	CGRK202603312455	采购入库反审核	2026-04-03 07:15:50.902554
1655	860	普通瓜子	0		procure_in_reverse	-5	5	0	CGRK202603317076	采购入库反审核	2026-04-03 07:15:53.591321
1656	861	五香瓜子	0		procure_in_reverse	-10	10	0	CGRK202603317076	采购入库反审核	2026-04-03 07:15:53.599767
1658	997	茶专用/盐包	0		procure_in_reverse	-10	3780	3770	CGRK202603314559	采购入库反审核	2026-04-03 07:15:56.277084
1664	981	烤奶皮	0		procure_in_reverse	-10	44	34	CGRK202603313499	采购入库反审核	2026-04-03 07:16:00.340905
1667	865	牛肉干/和希格图	0		procure_in_reverse	-20	20	0	CGRK202603313723	采购入库反审核	2026-04-03 07:16:05.052012
1672	944	半成品/透明/奶皮千层	0		procure_in_reverse	-21	61	40	CGRK202603316444	采购入库反审核	2026-04-03 07:16:07.813118
1673	885	冻炒米/散装	0		procure_in_reverse	-10	46	36	CGRK202603316444	采购入库反审核	2026-04-03 07:16:07.82249
448	1020	标签/不干胶/奶果子	0		procure_in	500	0	500	CGRK202603312482	采购入库审核	2026-03-31 15:29:03.742484
449	950	透专标签/奶皮卷	0		procure_in	500	1000	1500	CGRK202603312482	采购入库审核	2026-03-31 15:29:03.751572
450	951	透专标签/冻炒米	0		procure_in	500	1000	1500	CGRK202603312482	采购入库审核	2026-03-31 15:29:03.76131
451	952	透专标签/奶酪/原味	0		procure_in	500	1000	1500	CGRK202603312482	采购入库审核	2026-03-31 15:29:03.770665
452	953	透专标签/奶酪/甜味	0		procure_in	500	1000	1500	CGRK202603312482	采购入库审核	2026-03-31 15:29:03.779958
453	954	透专标签/乳清奶条/甜味	0		procure_in	500	0	500	CGRK202603312482	采购入库审核	2026-03-31 15:29:03.789197
454	955	透专标签/乳清奶条/原味	0		procure_in	500	0	500	CGRK202603312482	采购入库审核	2026-03-31 15:29:03.798101
455	956	透专标签/鲜奶皮	0		procure_in	500	1000	1500	CGRK202603312482	采购入库审核	2026-03-31 15:29:03.806471
457	973	精品/奶豆腐块儿/甜味/	0		procure_in	20	54	74	CGRK202603318332	采购入库审核	2026-03-31 15:29:07.912804
458	986	精品/奶豆腐块儿/原味	0		procure_in	20	120	140	CGRK202603318332	采购入库审核	2026-03-31 15:29:07.922686
459	974	纯净黄油/瓶装好的	0		procure_in	32	102	134	CGRK202603318332	采购入库审核	2026-03-31 15:29:07.934093
467	979	新茶包/纸	0		procure_in	20000	20000	40000	CGRK202603319374	采购入库审核	2026-03-31 15:29:12.546749
468	1020	标签/不干胶/奶果子	0		procure_in	500	500	1000	CGRK202603319374	采购入库审核	2026-03-31 15:29:12.55555
469	950	透专标签/奶皮卷	0		procure_in	500	1500	2000	CGRK202603319374	采购入库审核	2026-03-31 15:29:12.565722
470	951	透专标签/冻炒米	0		procure_in	500	1500	2000	CGRK202603319374	采购入库审核	2026-03-31 15:29:12.57685
471	952	透专标签/奶酪/原味	0		procure_in	500	1500	2000	CGRK202603319374	采购入库审核	2026-03-31 15:29:12.585622
472	953	透专标签/奶酪/甜味	0		procure_in	500	1500	2000	CGRK202603319374	采购入库审核	2026-03-31 15:29:12.594541
473	954	透专标签/乳清奶条/甜味	0		procure_in	500	500	1000	CGRK202603319374	采购入库审核	2026-03-31 15:29:12.60337
474	955	透专标签/乳清奶条/原味	0		procure_in	500	500	1000	CGRK202603319374	采购入库审核	2026-03-31 15:29:12.61204
475	956	透专标签/鲜奶皮	0		procure_in	500	1500	2000	CGRK202603319374	采购入库审核	2026-03-31 15:29:12.6249
484	972	原味/散称/奶豆腐块儿	0		procure_in	10	10	20	CGRK202603317488	采购入库审核	2026-03-31 15:29:16.886313
485	971	甜味/散称/奶豆腐块儿	0		procure_in	10	10	20	CGRK202603317488	采购入库审核	2026-03-31 15:29:16.895663
486	965	半成品/透明/冻炒米	0		procure_in	38	38	76	CGRK202603317488	采购入库审核	2026-03-31 15:29:16.904515
487	970	热奶豆腐碗	0		procure_in	50	86	136	CGRK202603317488	采购入库审核	2026-03-31 15:29:16.91334
488	968	大/奶皮	0		procure_in	30	90	120	CGRK202603317488	采购入库审核	2026-03-31 15:29:16.922283
489	969	小/奶皮	0		procure_in	30	30	60	CGRK202603317488	采购入库审核	2026-03-31 15:29:16.931916
490	967	查嘎/乳清	0		procure_in	5	5	10	CGRK202603317488	采购入库审核	2026-03-31 15:29:16.94039
491	966	查嘎粉/小包装袋	0		procure_in	30	30	60	CGRK202603317488	采购入库审核	2026-03-31 15:29:16.951684
495	1027	真空袋	0		procure_in	500	0	500	CGRK202603313044	采购入库审核	2026-03-31 15:29:24.468271
496	982	塑料手提袋	0		procure_in	5000	5000	10000	CGRK202603317738	采购入库审核	2026-03-31 15:29:26.666999
497	1016	专瓶/黄油	0		procure_in	240	240	480	CGRK202603312017	采购入库审核	2026-03-31 15:29:28.806896
498	862	专瓶/黄油渣	0		procure_in	120	120	240	CGRK202603312017	采购入库审核	2026-03-31 15:29:28.815629
499	1027	真空袋	0		procure_in	500	500	1000	CGRK202603312344	采购入库审核	2026-03-31 15:29:30.855909
500	1014	散装/甜味奶条	0		procure_in	21	46	67	CGRK202603317227	采购入库审核	2026-03-31 15:29:38.416682
501	1000	木勺	0		procure_in	10	0	10	CGRK202603317084	采购入库审核	2026-03-31 15:29:40.56324
502	995	茶专用/热缩膜	0		procure_in	2600	0	2600	CGRK202603314460	采购入库审核	2026-03-31 15:29:42.671526
503	1002	封口机/真空	0		procure_in	1	2	3	CGRK202603312389	采购入库审核	2026-03-31 15:29:44.770548
504	1001	冷冻柜/冰箱	0		procure_in	1	0	1	CGRK202603317776	采购入库审核	2026-03-31 15:29:46.845924
505	1019	标签/不干胶/冻炒米	0		procure_in	500	0	500	CGRK202603318283	采购入库审核	2026-03-31 15:29:49.112608
506	984	茶包/类腰封纸	0		procure_in	2000	0	2000	CGRK202603318283	采购入库审核	2026-03-31 15:29:49.122166
507	975	黄油脖签	0		procure_in	500	0	500	CGRK202603318283	采购入库审核	2026-03-31 15:29:49.131688
508	978	新茶专用标签纸	0		procure_in	3000	0	3000	CGRK202603318283	采购入库审核	2026-03-31 15:29:49.141019
509	983	甜味/标签/不干胶/传统奶豆腐	0		procure_in	25	500	525	CGRK202603311075	采购入库审核	2026-03-31 15:29:51.24109
510	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	25	500	525	CGRK202603311075	采购入库审核	2026-03-31 15:29:51.250427
511	999	茶专用/不干胶/标签	0		procure_in	60	0	60	CGRK202603311075	采购入库审核	2026-03-31 15:29:51.259196
512	1019	标签/不干胶/冻炒米	0		procure_in	500	500	1000	CGRK202603317281	采购入库审核	2026-03-31 15:29:53.50177
513	984	茶包/类腰封纸	0		procure_in	2000	2000	4000	CGRK202603317281	采购入库审核	2026-03-31 15:29:53.511689
514	975	黄油脖签	0		procure_in	500	500	1000	CGRK202603317281	采购入库审核	2026-03-31 15:29:53.52167
515	978	新茶专用标签纸	0		procure_in	3000	3000	6000	CGRK202603317281	采购入库审核	2026-03-31 15:29:53.53089
516	983	甜味/标签/不干胶/传统奶豆腐	0		procure_in	25	525	550	CGRK202603313456	采购入库审核	2026-03-31 15:29:55.730893
517	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	25	525	550	CGRK202603313456	采购入库审核	2026-03-31 15:29:55.740427
518	999	茶专用/不干胶/标签	0		procure_in	60	60	120	CGRK202603313456	采购入库审核	2026-03-31 15:29:55.750586
519	1010	奶油球	0		procure_in	10	40	50	CGRK202603314211	采购入库审核	2026-03-31 15:29:57.789763
520	997	茶专用/盐包	0		procure_in	8	10	18	CGRK202603312404	采购入库审核	2026-03-31 15:30:00.003521
521	989	蒙古黄油/瓶装成品	0		procure_in	1	0	1	CGRK202603312720	采购入库审核	2026-03-31 15:30:02.125382
522	989	蒙古黄油/瓶装成品	0		procure_in	2	1	3	CGRK202603312720	采购入库审核	2026-03-31 15:30:02.135176
523	988	原味传统奶豆腐/成品袋装	0		procure_in	2	0	2	CGRK202603312720	采购入库审核	2026-03-31 15:30:02.144322
524	997	茶专用/盐包	0		procure_in	3560	18	3578	CGRK202603319814	采购入库审核	2026-03-31 15:30:04.947784
525	1013	冻炒米/给组装半成品/那牧尔	0		procure_in	3	480	483	CGRK202603315166	采购入库审核	2026-03-31 15:30:07.24195
526	1010	奶油球	0		procure_in	10	50	60	CGRK202603315724	采购入库审核	2026-03-31 15:30:09.535189
527	987	采购样品专用/乳制品	0		procure_in	14	0	14	CGRK202603312742	采购入库审核	2026-03-31 15:30:11.805896
528	1003	热收缩膜机	0		procure_in	1	0	1	CGRK202603313416	采购入库审核	2026-03-31 15:30:13.914275
529	1013	冻炒米/给组装半成品/那牧尔	0		procure_in	30	483	513	CGRK202603311843	采购入库审核	2026-03-31 15:30:24.916787
530	1009	专盒/青砖奶茶外盒	0		procure_in	3030	0	3030	CGRK202603317409	采购入库审核	2026-03-31 15:30:27.130095
531	1015	散装/原味奶条	0		procure_in	15	24	39	CGRK202603315894	采购入库审核	2026-03-31 15:30:29.75308
532	1010	奶油球	0		procure_in	8	60	68	CGRK202603316571	采购入库审核	2026-03-31 15:30:31.970969
533	1011	茶包	0		procure_in	8	10	18	CGRK202603311827	采购入库审核	2026-03-31 15:30:34.223521
534	997	茶专用/盐包	0		procure_in	2	3578	3580	CGRK202603314744	采购入库审核	2026-03-31 15:30:37.162847
535	997	茶专用/盐包	0		procure_in	200	3580	3780	CGRK202603314744	采购入库审核	2026-03-31 15:30:37.175417
536	1000	木勺	0		procure_in	2	10	12	CGRK202603317862	采购入库审核	2026-03-31 15:30:39.255653
537	1000	木勺	0		procure_in	200	12	212	CGRK202603317862	采购入库审核	2026-03-31 15:30:39.264557
538	998	茶专用/硫酸纸	0		procure_in	1000	0	1000	CGRK202603315535	采购入库审核	2026-03-31 15:30:41.923069
539	999	茶专用/不干胶/标签	0		procure_in	1000	120	1120	CGRK202603315535	采购入库审核	2026-03-31 15:30:41.93188
540	995	茶专用/热缩膜	0		procure_in	10	2600	2610	CGRK202603312868	采购入库审核	2026-03-31 15:30:44.131963
541	1009	专盒/青砖奶茶外盒	0		procure_in	200	3030	3230	CGRK202603318063	采购入库审核	2026-03-31 15:30:46.273927
542	993	冻炒米专用/塑膜袋	0		procure_in	500	2000	2500	CGRK202603311837	采购入库审核	2026-03-31 15:30:48.580274
543	990	奶果子/专用塑膜袋	0		procure_in	1000	0	1000	CGRK202603317539	采购入库审核	2026-03-31 15:30:53.360712
544	1031	专底盒/奶条	0		procure_in	30	0	30	CGRK202603319931	采购入库审核	2026-03-31 15:30:58.495771
545	1031	专底盒/奶条	0		procure_in	3	30	33	CGRK202603319931	采购入库审核	2026-03-31 15:30:58.505182
546	1029	专内盒/奶果子	0		procure_in	8	0	8	CGRK202603311805	采购入库审核	2026-03-31 15:31:00.767847
547	1030	专外盒/奶果子	0		procure_in	6	0	6	CGRK202603311805	采购入库审核	2026-03-31 15:31:00.773957
548	1028	专标签/黄油	0		procure_in	16	0	16	CGRK202603318955	采购入库审核	2026-03-31 15:31:03.059727
549	1027	真空袋	0		procure_in	60	1000	1060	CGRK202603316109	采购入库审核	2026-03-31 15:31:05.46936
550	1026	专内袋/奶果子	0		procure_in	16	0	16	CGRK202603318147	采购入库审核	2026-03-31 15:31:07.713584
551	1026	专内袋/奶果子	0		procure_in	13	16	29	CGRK202603318147	采购入库审核	2026-03-31 15:31:07.723464
552	1025	定制款/专内袋/扎那家奶果子	0		procure_in	16	0	16	CGRK202603318163	采购入库审核	2026-03-31 15:31:10.066163
553	1025	定制款/专内袋/扎那家奶果子	0		procure_in	170	16	186	CGRK202603318163	采购入库审核	2026-03-31 15:31:10.075624
554	1024	标签/不干胶/奶条/甜味	0		procure_in	77	1000	1077	CGRK202603318548	采购入库审核	2026-03-31 15:31:12.327473
555	1023	标签/不干胶/奶条/原味	0		procure_in	27	0	27	CGRK202603318548	采购入库审核	2026-03-31 15:31:12.33561
556	1022	专袋/传统奶豆腐	0		procure_in	90	0	90	CGRK202603318109	采购入库审核	2026-03-31 15:31:14.483394
557	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	14	550	564	CGRK202603314892	采购入库审核	2026-03-31 15:31:16.645543
558	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	15	564	579	CGRK202603314892	采购入库审核	2026-03-31 15:31:16.654833
559	1020	标签/不干胶/奶果子	0		procure_in	13	1000	1013	CGRK202603311132	采购入库审核	2026-03-31 15:31:18.893102
560	1019	标签/不干胶/冻炒米	0		procure_in	500	1000	1500	CGRK202603318352	采购入库审核	2026-03-31 15:31:21.028022
561	1032	专盒/冻炒米	0		procure_in	1650	32	1682	CGRK202603318352	采购入库审核	2026-03-31 15:31:21.03776
562	1018	礼盒/蓝界	0		procure_in	30	0	30	CGRK202603318644	采购入库审核	2026-03-31 15:31:23.418331
563	1018	礼盒/蓝界	0		procure_in	26	30	56	CGRK202603318644	采购入库审核	2026-03-31 15:31:23.427703
564	1017	手提袋	0		procure_in	368	0	368	CGRK202603319888	采购入库审核	2026-03-31 15:31:25.59712
565	1033	专袋/奶条	0		procure_in	80	185	265	CGRK202603319888	采购入库审核	2026-03-31 15:31:25.606287
566	1033	专袋/奶条	0		procure_in	20	265	285	CGRK202603319888	采购入库审核	2026-03-31 15:31:25.615917
567	1033	专袋/奶条	0		procure_in	86	285	371	CGRK202603319888	采购入库审核	2026-03-31 15:31:25.625527
568	1033	专袋/奶条	0		procure_in	5	371	376	CGRK202603319888	采购入库审核	2026-03-31 15:31:25.634993
569	1031	专底盒/奶条	0		procure_in	17	33	50	CGRK202603319888	采购入库审核	2026-03-31 15:31:25.64379
570	1031	专底盒/奶条	0		procure_in	24	50	74	CGRK202603319888	采购入库审核	2026-03-31 15:31:25.653625
571	1033	专袋/奶条	0		procure_in	17	376	393	CGRK202603319881	采购入库审核	2026-03-31 15:31:27.907972
572	1033	专袋/奶条	0		procure_in	16	393	409	CGRK202603319881	采购入库审核	2026-03-31 15:31:27.91721
573	1033	专袋/奶条	0		procure_in	47	409	456	CGRK202603319881	采购入库审核	2026-03-31 15:31:27.925997
574	1033	专袋/奶条	0		procure_in	7	456	463	CGRK202603319881	采购入库审核	2026-03-31 15:31:27.934472
575	1031	专底盒/奶条	0		procure_in	79	74	153	CGRK202603319881	采购入库审核	2026-03-31 15:31:27.943556
576	1031	专底盒/奶条	0		procure_in	33	153	186	CGRK202603319881	采购入库审核	2026-03-31 15:31:27.953024
577	1030	专外盒/奶果子	0		procure_in	6	6	12	CGRK202603319881	采购入库审核	2026-03-31 15:31:27.961781
578	1030	专外盒/奶果子	0		procure_in	34	12	46	CGRK202603319881	采购入库审核	2026-03-31 15:31:27.971027
579	1029	专内盒/奶果子	0		procure_in	24	8	32	CGRK202603319881	采购入库审核	2026-03-31 15:31:27.979986
580	1029	专内盒/奶果子	0		procure_in	37	32	69	CGRK202603319881	采购入库审核	2026-03-31 15:31:27.98869
581	1026	专内袋/奶果子	0		procure_in	25	29	54	CGRK202603319881	采购入库审核	2026-03-31 15:31:27.997959
582	1026	专内袋/奶果子	0		procure_in	82	54	136	CGRK202603319881	采购入库审核	2026-03-31 15:31:28.006653
583	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	748	579	1327	CGRK202603316489	采购入库审核	2026-03-31 15:31:30.244338
584	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	9	1327	1336	CGRK202603316489	采购入库审核	2026-03-31 15:31:30.253575
585	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	260	1336	1596	CGRK202603316489	采购入库审核	2026-03-31 15:31:30.262842
586	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	76	1596	1672	CGRK202603316489	采购入库审核	2026-03-31 15:31:30.272017
587	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	18	1672	1690	CGRK202603316489	采购入库审核	2026-03-31 15:31:30.281049
588	1022	专袋/传统奶豆腐	0		procure_in	79	90	169	CGRK202603317845	采购入库审核	2026-03-31 15:31:32.399993
589	1022	专袋/传统奶豆腐	0		procure_in	23	169	192	CGRK202603317845	采购入库审核	2026-03-31 15:31:32.40888
590	1027	真空袋	0		procure_in	20	1060	1080	CGRK202603311463	采购入库审核	2026-03-31 15:31:34.358439
591	1016	专瓶/黄油	0		procure_in	55	480	535	CGRK202603312514	采购入库审核	2026-03-31 15:31:36.938073
592	1032	专盒/冻炒米	0		procure_in	36	1682	1718	CGRK202603313100	采购入库审核	2026-03-31 15:31:38.999298
593	1032	专盒/冻炒米	0		procure_in	20	1718	1738	CGRK202603313100	采购入库审核	2026-03-31 15:31:39.01003
594	1023	标签/不干胶/奶条/原味	0		procure_in	298	27	325	CGRK202603313100	采购入库审核	2026-03-31 15:31:39.019162
595	1020	标签/不干胶/奶果子	0		procure_in	111	1013	1124	CGRK202603313100	采购入库审核	2026-03-31 15:31:39.028774
596	1028	专标签/黄油	0		procure_in	340	16	356	CGRK202603313100	采购入库审核	2026-03-31 15:31:39.037761
597	1028	专标签/黄油	0		procure_in	500	356	856	CGRK202603313100	采购入库审核	2026-03-31 15:31:39.065506
598	1024	标签/不干胶/奶条/甜味	0		procure_in	10	1077	1087	CGRK202603313100	采购入库审核	2026-03-31 15:31:39.074405
599	902	乌日莫糖/散装	0		procure_in_reverse	-5	30	25	CGRK202603314400	采购入库反审核	2026-03-31 16:28:44.855264
600	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-5	44	39	CGRK202603319747	采购入库反审核	2026-03-31 16:28:46.624578
601	922	酸奶炒米糖/散装	0		procure_in_reverse	-5	24	19	CGRK202603318354	采购入库反审核	2026-03-31 16:28:49.112136
602	920	手工乌日末液体	0		procure_in_reverse	-10	128	118	CGRK202603314800	采购入库反审核	2026-03-31 16:28:51.24219
603	981	烤奶皮	0		procure_in_reverse	-10	114	104	CGRK202603315191	采购入库反审核	2026-03-31 16:28:54.437086
604	857	厚奶皮	0		procure_in_reverse	-20	50	30	CGRK202603312834	采购入库反审核	2026-03-31 16:28:56.52464
605	804	德吉酸奶/2斤装	0		procure_in_reverse	-10	10	0	CGRK202603316167	采购入库反审核	2026-03-31 16:29:00.137064
606	805	德吉酸奶/一斤装	0		procure_in_reverse	-10	10	0	CGRK202603316167	采购入库反审核	2026-03-31 16:29:00.146365
607	806	德吉酸奶/半斤	0		procure_in_reverse	-10	10	0	CGRK202603316167	采购入库反审核	2026-03-31 16:29:00.156219
608	811	蒙古果子/格日勒	0		procure_in_reverse	-12	12	0	CGRK202603316519	采购入库反审核	2026-03-31 16:29:03.819915
609	908	哈斯乌拉牛肉干500g原味	0		procure_in_reverse	-10	19	9	CGRK202603317521	采购入库反审核	2026-03-31 16:29:05.590162
610	856	科尔沁/大奶豆腐	0		procure_in_reverse	-5	13	8	CGRK202603317495	采购入库反审核	2026-03-31 16:29:08.04921
611	829	奶豆腐/原味/中/科尔沁	0		procure_in_reverse	-5	15	10	CGRK202603317495	采购入库反审核	2026-03-31 16:29:08.058708
612	903	盛宇燃奶豆腐/甜味	0		procure_in_reverse	-5	17	12	CGRK202603317495	采购入库反审核	2026-03-31 16:29:08.067838
613	904	盛宇燃奶豆腐/原味	0		procure_in_reverse	-5	18	13	CGRK202603317495	采购入库反审核	2026-03-31 16:29:08.077824
614	907	风干牛肉500g大片	0		procure_in_reverse	-5	13	8	CGRK202603313556	采购入库反审核	2026-03-31 16:29:09.658405
615	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-5	39	34	CGRK202603313556	采购入库反审核	2026-03-31 16:29:09.668588
616	932	炒米海丰	0		procure_in_reverse	-20	40	20	CGRK202603313556	采购入库反审核	2026-03-31 16:29:09.67787
617	931	炒米粉/aag	0		procure_in_reverse	-10	40	30	CGRK202603313556	采购入库反审核	2026-03-31 16:29:09.687033
618	823	黄油/中瓶	0		procure_in_reverse	-10	15	5	CGRK202603313556	采购入库反审核	2026-03-31 16:29:09.696413
619	907	风干牛肉500g大片	0		procure_in_reverse	-2	8	6	CGRK202603312507	采购入库反审核	2026-03-31 16:29:11.250001
620	916	脆奶条/散装/科尔沁	0		procure_in_reverse	-10	80	70	CGRK202603312507	采购入库反审核	2026-03-31 16:29:11.258951
621	903	盛宇燃奶豆腐/甜味	0		procure_in_reverse	-5	12	7	CGRK202603312507	采购入库反审核	2026-03-31 16:29:11.26824
622	904	盛宇燃奶豆腐/原味	0		procure_in_reverse	-5	13	8	CGRK202603312507	采购入库反审核	2026-03-31 16:29:11.277927
623	823	黄油/中瓶	0		procure_in_reverse	-5	5	0	CGRK202603312507	采购入库反审核	2026-03-31 16:29:11.28749
624	822	黄油/大瓶/科尔沁	0		procure_in_reverse	-5	5	0	CGRK202603312507	采购入库反审核	2026-03-31 16:29:11.296339
625	829	奶豆腐/原味/中/科尔沁	0		procure_in_reverse	-5	10	5	CGRK202603312507	采购入库反审核	2026-03-31 16:29:11.305129
626	908	哈斯乌拉牛肉干500g原味	0		procure_in_reverse	-2	9	7	CGRK202603312507	采购入库反审核	2026-03-31 16:29:11.31382
627	923	炒米/散装/硬口	0		procure_in_reverse	-30	34	4	CGRK202603313924	采购入库反审核	2026-03-31 16:29:12.981492
628	920	手工乌日末液体	0		procure_in_reverse	-10	118	108	CGRK202603314071	采购入库反审核	2026-03-31 16:29:14.488977
629	825	故乡宝酸马奶	0		procure_in_reverse	-3	3	0	CGRK202603315252	采购入库反审核	2026-03-31 16:29:15.987725
630	826	乌日汗酸奶	0		procure_in_reverse	-5	5	0	CGRK202603315252	采购入库反审核	2026-03-31 16:29:15.997836
631	829	奶豆腐/原味/中/科尔沁	0		procure_in_reverse	-5	5	0	CGRK202603316821	采购入库反审核	2026-03-31 16:29:17.53382
632	901	手工白花炒米/散装	0		procure_in_reverse	-30	120	90	CGRK202603312902	采购入库反审核	2026-03-31 16:29:19.036617
633	830	小米/10斤/小袋	0		procure_in_reverse	-2	7	5	CGRK202603317338	采购入库反审核	2026-03-31 16:29:20.564493
634	830	小米/10斤/小袋	0		procure_in_reverse	-5	5	0	CGRK202603317338	采购入库反审核	2026-03-31 16:29:20.573347
635	809	10斤装/小米/绿色纸盒	0		procure_in_reverse	-8	8	0	CGRK202603317338	采购入库反审核	2026-03-31 16:29:20.583127
636	857	厚奶皮	0		procure_in_reverse	-20	30	10	CGRK202603317175	采购入库反审核	2026-03-31 16:29:22.048639
637	920	手工乌日末液体	0		procure_in_reverse	-10	108	98	CGRK202603313280	采购入库反审核	2026-03-31 16:29:23.650943
638	981	烤奶皮	0		procure_in_reverse	-40	104	64	CGRK202603317026	采购入库反审核	2026-03-31 16:29:25.772032
639	903	盛宇燃奶豆腐/甜味	0		procure_in_reverse	-3	7	4	CGRK202603317026	采购入库反审核	2026-03-31 16:29:25.781986
640	904	盛宇燃奶豆腐/原味	0		procure_in_reverse	-4	8	4	CGRK202603317026	采购入库反审核	2026-03-31 16:29:25.796194
641	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-10	34	24	CGRK202603317026	采购入库反审核	2026-03-31 16:29:25.806561
642	860	普通瓜子	0		procure_in_reverse	-10	15	5	CGRK202603313622	采购入库反审核	2026-03-31 16:29:27.307056
643	880	阿润月饼/五仁馅	0		procure_in_reverse	-10	18	8	CGRK202603311146	采购入库反审核	2026-03-31 16:29:28.823518
644	882	阿润月饼/黄油渣馅	0		procure_in_reverse	-5	13	8	CGRK202603311146	采购入库反审核	2026-03-31 16:29:28.832138
645	831	果条/阿润	0		procure_in_reverse	-5	5	0	CGRK202603311146	采购入库反审核	2026-03-31 16:29:28.840668
659	836	礼盒/2026	0		procure_in_reverse	-540	540	0	CGRK202603315542	采购入库反审核	2026-03-31 16:29:38.080441
664	920	手工乌日末液体	0		procure_in_reverse	-10	98	88	CGRK202603315575	采购入库反审核	2026-03-31 16:29:41.807344
666	852	牛肉干/散/孜然	0		procure_in_reverse	-5	5	0	CGRK202603311311	采购入库反审核	2026-03-31 16:29:44.971078
667	853	牛肉干/散/香辣	0		procure_in_reverse	-5	5	0	CGRK202603311311	采购入库反审核	2026-03-31 16:29:44.980712
668	854	牛肉干/散/原味	0		procure_in_reverse	-5	5	0	CGRK202603311311	采购入库反审核	2026-03-31 16:29:44.989744
670	850	红糖袋/delicious	0		procure_in_reverse	-100	100	0	CGRK202603313441	采购入库反审核	2026-03-31 16:29:48.361683
671	993	冻炒米专用/塑膜袋	0		procure_in_reverse	-2000	2500	500	CGRK202603314948	采购入库反审核	2026-03-31 16:29:50.823764
674	872	半成品/黄金纬度牛肉干/那牧尔	0		procure_in_reverse	-130	130	0	CGRK202603315956	采购入库反审核	2026-03-31 16:29:54.08467
676	981	烤奶皮	0		procure_in_reverse	-10	64	54	CGRK202603314690	采购入库反审核	2026-03-31 16:29:57.24383
677	901	手工白花炒米/散装	0		procure_in_reverse	-30	90	60	CGRK202603314690	采购入库反审核	2026-03-31 16:29:57.253167
680	858	糖葫芦	0		procure_in_reverse	-40	40	0	CGRK202603319491	采购入库反审核	2026-03-31 16:30:00.78848
683	963	小/方形/亚克力盒/	0		procure_in_reverse	-720	1200	480	CGRK202603315735	采购入库反审核	2026-03-31 16:30:06.121541
686	931	炒米粉/aag	0		procure_in_reverse	-10	30	20	CGRK202603318844	采购入库反审核	2026-03-31 16:30:09.676668
688	991	奶果子/散装	0		procure_in_reverse	-119	119	0	CGRK202603319311	采购入库反审核	2026-03-31 16:30:13.358053
693	981	烤奶皮	0		procure_in_reverse	-10	44	34	CGRK202603313499	采购入库反审核	2026-03-31 16:30:16.38351
694	866	酸奶/纯净	0		procure_in_reverse	-10	10	0	CGRK202603314814	采购入库反审核	2026-03-31 16:30:19.025023
695	865	牛肉干/和希格图	0		procure_in_reverse	-20	20	0	CGRK202603313723	采购入库反审核	2026-03-31 16:30:20.609163
700	944	半成品/透明/奶皮千层	0		procure_in_reverse	-21	61	40	CGRK202603316444	采购入库反审核	2026-03-31 16:30:24.177751
701	885	冻炒米/散装	0		procure_in_reverse	-10	20	10	CGRK202603316444	采购入库反审核	2026-03-31 16:30:24.186482
702	863	冻炒米/小包散/精品	0		procure_in_reverse	-100	100	0	CGRK202603316444	采购入库反审核	2026-03-31 16:30:24.194883
706	870	大青砖茶砖	0		procure_in_reverse	-1	1	0	CGRK202603312281	采购入库反审核	2026-03-31 16:30:27.713864
707	871	小青砖茶砖	0		procure_in_reverse	-1	1	0	CGRK202603312281	采购入库反审核	2026-03-31 16:30:27.722998
708	869	青砖碎茶	0		procure_in_reverse	-1	1	0	CGRK202603312281	采购入库反审核	2026-03-31 16:30:27.734363
709	867	5g/青砖袋泡茶	0		procure_in_reverse	-1	1	0	CGRK202603312281	采购入库反审核	2026-03-31 16:30:27.743256
710	868	16g青砖袋泡茶	0		procure_in_reverse	-1	1	0	CGRK202603312281	采购入库反审核	2026-03-31 16:30:27.752104
1552	1026	专内袋/奶果子	0		procure_in	25	29	54	CGRK202603319881	采购入库审核	2026-03-31 16:43:21.624538
1553	1026	专内袋/奶果子	0		procure_in	82	54	136	CGRK202603319881	采购入库审核	2026-03-31 16:43:21.630712
1554	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	748	579	1327	CGRK202603316489	采购入库审核	2026-03-31 16:43:23.733482
1555	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	9	1327	1336	CGRK202603316489	采购入库审核	2026-03-31 16:43:23.739001
1556	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	260	1336	1596	CGRK202603316489	采购入库审核	2026-03-31 16:43:23.744597
1557	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	76	1596	1672	CGRK202603316489	采购入库审核	2026-03-31 16:43:23.750383
1558	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	18	1672	1690	CGRK202603316489	采购入库审核	2026-03-31 16:43:23.755559
1561	1027	真空袋	0		procure_in	20	1060	1080	CGRK202603311463	采购入库审核	2026-03-31 16:43:28.001111
1563	1032	专盒/冻炒米	0		procure_in	36	1682	1718	CGRK202603313100	采购入库审核	2026-03-31 16:43:31.573407
1564	1032	专盒/冻炒米	0		procure_in	20	1718	1738	CGRK202603313100	采购入库审核	2026-03-31 16:43:31.579463
1565	1023	标签/不干胶/奶条/原味	0		procure_in	298	27	325	CGRK202603313100	采购入库审核	2026-03-31 16:43:31.586743
1566	1020	标签/不干胶/奶果子	0		procure_in	111	1013	1124	CGRK202603313100	采购入库审核	2026-03-31 16:43:31.593799
1567	1028	专标签/黄油	0		procure_in	340	16	356	CGRK202603313100	采购入库审核	2026-03-31 16:43:31.600045
1568	1028	专标签/黄油	0		procure_in	500	356	856	CGRK202603313100	采购入库审核	2026-03-31 16:43:31.608237
1569	1024	标签/不干胶/奶条/甜味	0		procure_in	10	1077	1087	CGRK202603313100	采购入库审核	2026-03-31 16:43:31.615125
1637	852	牛肉干/散/孜然	0		procure_in_reverse	-5	5	0	CGRK202603311311	采购入库反审核	2026-04-03 07:15:35.831238
1638	853	牛肉干/散/香辣	0		procure_in_reverse	-5	5	0	CGRK202603311311	采购入库反审核	2026-04-03 07:15:35.844054
1639	854	牛肉干/散/原味	0		procure_in_reverse	-5	5	0	CGRK202603311311	采购入库反审核	2026-04-03 07:15:35.852136
1640	851	晴王糖葫芦	0		procure_in_reverse	-10	10	0	CGRK202603315216	采购入库反审核	2026-04-03 07:15:37.200401
1642	993	冻炒米专用/塑膜袋	0		procure_in_reverse	-2000	2500	500	CGRK202603314948	采购入库反审核	2026-04-03 07:15:39.97808
1645	872	半成品/黄金纬度牛肉干/那牧尔	0		procure_in_reverse	-130	130	0	CGRK202603315956	采购入库反审核	2026-04-03 07:15:42.658925
1646	857	厚奶皮	0		procure_in_reverse	-10	10	0	CGRK202603316752	采购入库反审核	2026-04-03 07:15:44.002658
1649	879	干肉奶茶	0		procure_in_reverse	-10	18	8	CGRK202603313952	采购入库反审核	2026-04-03 07:15:46.79919
1650	859	糖/阿润	0		procure_in_reverse	-25	25	0	CGRK202603313952	采购入库反审核	2026-04-03 07:15:46.807933
1651	858	糖葫芦	0		procure_in_reverse	-40	40	0	CGRK202603319491	采购入库反审核	2026-04-03 07:15:48.165913
1654	963	小/方形/亚克力盒/	0		procure_in_reverse	-720	1200	480	CGRK202603315735	采购入库反审核	2026-04-03 07:15:52.250714
1657	931	炒米粉/aag	0		procure_in_reverse	-10	30	20	CGRK202603318844	采购入库反审核	2026-04-03 07:15:54.931626
1659	991	奶果子/散装	0		procure_in_reverse	-119	323	204	CGRK202603319311	采购入库反审核	2026-04-03 07:15:57.633504
1660	923	炒米/散装/硬口	0		procure_in_reverse	-1	3	2	CGRK202603311529	采购入库反审核	2026-04-03 07:15:58.982357
1661	981	烤奶皮	0		procure_in_reverse	-10	54	44	CGRK202603311529	采购入库反审核	2026-04-03 07:15:58.990647
1662	908	哈斯乌拉牛肉干500g原味	0		procure_in_reverse	-3	7	4	CGRK202603311529	采购入库反审核	2026-04-03 07:15:58.999115
646	916	脆奶条/散装/科尔沁	0		procure_in_reverse	-10	70	60	CGRK202603314323	采购入库反审核	2026-03-31 16:29:30.352455
647	845	乳清饮料	0		procure_in_reverse	-20	20	0	CGRK202603318569	采购入库反审核	2026-03-31 16:29:31.825264
648	846	酸奶/额吉伊德	0		procure_in_reverse	-6	6	0	CGRK202603318569	采购入库反审核	2026-03-31 16:29:31.834792
649	847	乌日莫/袋装	0		procure_in_reverse	-5	5	0	CGRK202603318569	采购入库反审核	2026-03-31 16:29:31.843822
650	838	奶粉蒙古国	0		procure_in_reverse	-3	3	0	CGRK202603318071	采购入库反审核	2026-03-31 16:29:33.80529
651	839	奶皮子粉	0		procure_in_reverse	-4	4	0	CGRK202603318071	采购入库反审核	2026-03-31 16:29:33.816926
652	840	奶茶粉战粮	0		procure_in_reverse	-2	2	0	CGRK202603318071	采购入库反审核	2026-03-31 16:29:33.831158
653	841	奶茶粉贡格尔	0		procure_in_reverse	-2	2	0	CGRK202603318071	采购入库反审核	2026-03-31 16:29:33.841024
654	842	努德勒沁调和茶	0		procure_in_reverse	-2	2	0	CGRK202603318071	采购入库反审核	2026-03-31 16:29:33.895059
655	843	阿依古丽奶茶专用红茶	0		procure_in_reverse	-2	2	0	CGRK202603318071	采购入库反审核	2026-03-31 16:29:33.905464
656	844	希日嘎拉奶茶专用茶	0		procure_in_reverse	-2	4	2	CGRK202603318071	采购入库反审核	2026-03-31 16:29:33.914545
657	837	甜味奶豆腐块儿/大	0		procure_in_reverse	-5	5	0	CGRK202603318071	采购入库反审核	2026-03-31 16:29:33.923629
658	844	希日嘎拉奶茶专用茶	0		procure_in_reverse	-2	2	0	CGRK202603318071	采购入库反审核	2026-03-31 16:29:33.932774
660	902	乌日莫糖/散装	0		procure_in_reverse	-5	25	20	CGRK202603312174	采购入库反审核	2026-03-31 16:29:39.722887
661	922	酸奶炒米糖/散装	0		procure_in_reverse	-5	19	14	CGRK202603312174	采购入库反审核	2026-03-31 16:29:39.732678
662	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-5	24	19	CGRK202603312174	采购入库反审核	2026-03-31 16:29:39.741969
663	856	科尔沁/大奶豆腐	0		procure_in_reverse	-5	8	3	CGRK202603312174	采购入库反审核	2026-03-31 16:29:39.751447
665	855	奶锅巴/扎旗吉十奶制品	0		procure_in_reverse	-5	5	0	CGRK202603316221	采购入库反审核	2026-03-31 16:29:43.352524
669	851	晴王糖葫芦	0		procure_in_reverse	-10	10	0	CGRK202603315216	采购入库反审核	2026-03-31 16:29:46.821881
672	856	科尔沁/大奶豆腐	0		procure_in_reverse	-3	3	0	CGRK202603318248	采购入库反审核	2026-03-31 16:29:52.557228
673	923	炒米/散装/硬口	0		procure_in_reverse	-1	4	3	CGRK202603318248	采购入库反审核	2026-03-31 16:29:52.570276
675	857	厚奶皮	0		procure_in_reverse	-10	10	0	CGRK202603316752	采购入库反审核	2026-03-31 16:29:55.584857
678	879	干肉奶茶	0		procure_in_reverse	-10	18	8	CGRK202603313952	采购入库反审核	2026-03-31 16:29:59.096466
679	859	糖/阿润	0		procure_in_reverse	-25	25	0	CGRK202603313952	采购入库反审核	2026-03-31 16:29:59.106536
681	1011	茶包	0		procure_in_reverse	-10	18	8	CGRK202603319187	采购入库反审核	2026-03-31 16:30:03.020491
682	920	手工乌日末液体	0		procure_in_reverse	-10	88	78	CGRK202603312455	采购入库反审核	2026-03-31 16:30:04.569384
684	860	普通瓜子	0		procure_in_reverse	-5	5	0	CGRK202603317076	采购入库反审核	2026-03-31 16:30:08.096939
685	861	五香瓜子	0		procure_in_reverse	-10	10	0	CGRK202603317076	采购入库反审核	2026-03-31 16:30:08.106254
687	997	茶专用/盐包	0		procure_in_reverse	-10	3780	3770	CGRK202603314559	采购入库反审核	2026-03-31 16:30:11.326695
689	923	炒米/散装/硬口	0		procure_in_reverse	-1	3	2	CGRK202603311529	采购入库反审核	2026-03-31 16:30:14.844799
690	981	烤奶皮	0		procure_in_reverse	-10	54	44	CGRK202603311529	采购入库反审核	2026-03-31 16:30:14.854369
691	908	哈斯乌拉牛肉干500g原味	0		procure_in_reverse	-3	7	4	CGRK202603311529	采购入库反审核	2026-03-31 16:30:14.863766
692	907	风干牛肉500g大片	0		procure_in_reverse	-2	6	4	CGRK202603311529	采购入库反审核	2026-03-31 16:30:14.873354
696	920	手工乌日末液体	0		procure_in_reverse	-10	78	68	CGRK202603312715	采购入库反审核	2026-03-31 16:30:22.593718
697	970	热奶豆腐碗	0		procure_in_reverse	-36	136	100	CGRK202603312715	采购入库反审核	2026-03-31 16:30:22.603992
698	939	半成品/透明/原味/鲜奶酪	0		procure_in_reverse	-20	100	80	CGRK202603312715	采购入库反审核	2026-03-31 16:30:22.612899
699	940	半成品/透明/甜味/鲜奶酪	0		procure_in_reverse	-52	132	80	CGRK202603312715	采购入库反审核	2026-03-31 16:30:22.621671
703	918	黄油/半斤	0		procure_in_reverse	-5	9	4	CGRK202603316006	采购入库反审核	2026-03-31 16:30:25.802872
704	919	黄油/斤	0		procure_in_reverse	-5	13	8	CGRK202603316006	采购入库反审核	2026-03-31 16:30:25.812697
705	885	冻炒米/散装	0		procure_in_reverse	-10	10	0	CGRK202603316006	采购入库反审核	2026-03-31 16:30:25.822632
711	878	羊奶粉/1斤	0		procure_in_reverse	-6	6	0	CGRK202603317078	采购入库反审核	2026-03-31 16:30:29.295214
712	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-5	19	14	CGRK202603315913	采购入库反审核	2026-03-31 16:30:31.78769
713	884	实惠/奶豆腐	0		procure_in_reverse	-9	18	9	CGRK202603313988	采购入库反审核	2026-03-31 16:30:33.289928
714	920	手工乌日末液体	0		procure_in_reverse	-10	68	58	CGRK202603313988	采购入库反审核	2026-03-31 16:30:33.299177
715	880	阿润月饼/五仁馅	0		procure_in_reverse	-4	8	4	CGRK202603313167	采购入库反审核	2026-03-31 16:30:35.239881
716	879	干肉奶茶	0		procure_in_reverse	-4	8	4	CGRK202603313167	采购入库反审核	2026-03-31 16:30:35.249096
717	881	阿润月饼/奶皮子馅	0		procure_in_reverse	-4	8	4	CGRK202603313167	采购入库反审核	2026-03-31 16:30:35.258174
718	882	阿润月饼/黄油渣馅	0		procure_in_reverse	-4	8	4	CGRK202603313167	采购入库反审核	2026-03-31 16:30:35.268302
719	883	阿润月饼/奶豆腐馅	0		procure_in_reverse	-4	8	4	CGRK202603313167	采购入库反审核	2026-03-31 16:30:35.276882
720	946	半成品/透明/鲜奶皮	0		procure_in_reverse	-40	138	98	CGRK202603313660	采购入库反审核	2026-03-31 16:30:36.817944
721	945	半成品/透明/奶皮卷	0		procure_in_reverse	-50	182	132	CGRK202603313660	采购入库反审核	2026-03-31 16:30:36.828429
722	944	半成品/透明/奶皮千层	0		procure_in_reverse	-20	40	20	CGRK202603313660	采购入库反审核	2026-03-31 16:30:36.838052
723	974	纯净黄油/瓶装好的	0		procure_in_reverse	-35	134	99	CGRK202603313660	采购入库反审核	2026-03-31 16:30:36.847626
724	899	纯净/黄油/斤	0		procure_in_reverse	-10	32	22	CGRK202603313660	采购入库反审核	2026-03-31 16:30:36.856274
725	920	手工乌日末液体	0		procure_in_reverse	-4	58	54	CGRK202603313660	采购入库反审核	2026-03-31 16:30:36.871325
726	968	大/奶皮	0		procure_in_reverse	-30	120	90	CGRK202603313660	采购入库反审核	2026-03-31 16:30:36.88239
727	1024	标签/不干胶/奶条/甜味	0		procure_in_reverse	-500	1087	587	CGRK202603316909	采购入库反审核	2026-03-31 16:30:38.410166
729	983	甜味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-500	550	50	CGRK202603312826	采购入库反审核	2026-03-31 16:30:41.687882
730	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-500	1690	1190	CGRK202603312826	采购入库反审核	2026-03-31 16:30:41.697368
733	880	阿润月饼/五仁馅	0		procure_in_reverse	-4	4	0	CGRK202603319433	采购入库反审核	2026-03-31 16:30:44.741254
734	879	干肉奶茶	0		procure_in_reverse	-4	4	0	CGRK202603319433	采购入库反审核	2026-03-31 16:30:44.749949
735	881	阿润月饼/奶皮子馅	0		procure_in_reverse	-4	4	0	CGRK202603319433	采购入库反审核	2026-03-31 16:30:44.7588
736	882	阿润月饼/黄油渣馅	0		procure_in_reverse	-4	4	0	CGRK202603319433	采购入库反审核	2026-03-31 16:30:44.768365
737	883	阿润月饼/奶豆腐馅	0		procure_in_reverse	-4	4	0	CGRK202603319433	采购入库反审核	2026-03-31 16:30:44.7788
745	1024	标签/不干胶/奶条/甜味	0		procure_in_reverse	-500	587	87	CGRK202603312169	采购入库反审核	2026-03-31 16:30:48.191051
747	889	奶皮卷/科尔沁	0		procure_in_reverse	-10	24	14	CGRK202603312674	采购入库反审核	2026-03-31 16:30:51.455585
749	945	半成品/透明/奶皮卷	0		procure_in_reverse	-25	57	32	CGRK202603312506	采购入库反审核	2026-03-31 16:30:55.675176
751	973	精品/奶豆腐块儿/甜味/	0		procure_in_reverse	-17	74	57	CGRK202603314149	采购入库反审核	2026-03-31 16:31:01.215035
752	986	精品/奶豆腐块儿/原味	0		procure_in_reverse	-50	140	90	CGRK202603314149	采购入库反审核	2026-03-31 16:31:01.224209
758	890	红枣	0		procure_in_reverse	-12	12	0	CGRK202603319636	采购入库反审核	2026-03-31 16:31:04.495132
761	916	脆奶条/散装/科尔沁	0		procure_in_reverse	-20	40	20	CGRK202603314619	采购入库反审核	2026-03-31 16:31:08.000343
762	889	奶皮卷/科尔沁	0		procure_in_reverse	-7	7	0	CGRK202603314619	采购入库反审核	2026-03-31 16:31:08.011187
763	886	冻炒米/科尔沁	0		procure_in_reverse	-2	2	0	CGRK202603314619	采购入库反审核	2026-03-31 16:31:08.022001
764	887	羊乳奶粉/奶茶专用	0		procure_in_reverse	-4	4	0	CGRK202603314619	采购入库反审核	2026-03-31 16:31:08.032167
765	888	河套奶粉	0		procure_in_reverse	-4	4	0	CGRK202603314619	采购入库反审核	2026-03-31 16:31:08.04135
767	1015	散装/原味奶条	0		procure_in_reverse	-12	39	27	CGRK202603311843	采购入库反审核	2026-03-31 16:31:11.196616
769	1015	散装/原味奶条	0		procure_in_reverse	-12	27	15	CGRK202603317384	采购入库反审核	2026-03-31 16:31:15.120586
773	891	芝士奶豆腐月饼	0		procure_in_reverse	-10	20	10	CGRK202603316826	采购入库反审核	2026-03-31 16:31:19.357931
774	893	奶豆腐月饼	0		procure_in_reverse	-10	20	10	CGRK202603316826	采购入库反审核	2026-03-31 16:31:19.367782
775	892	那牧尔酸奶	0		procure_in_reverse	-10	20	10	CGRK202603316826	采购入库反审核	2026-03-31 16:31:19.376537
776	895	黄油渣月饼	0		procure_in_reverse	-10	20	10	CGRK202603316826	采购入库反审核	2026-03-31 16:31:19.385352
777	896	奶皮月饼	0		procure_in_reverse	-10	20	10	CGRK202603316826	采购入库反审核	2026-03-31 16:31:19.394213
778	897	早餐包/那牧尔	0		procure_in_reverse	-10	20	10	CGRK202603316826	采购入库反审核	2026-03-31 16:31:19.402733
779	894	酸奶月饼	0		procure_in_reverse	-10	20	10	CGRK202603316826	采购入库反审核	2026-03-31 16:31:19.411813
783	891	芝士奶豆腐月饼	0		procure_in_reverse	-10	10	0	CGRK202603315807	采购入库反审核	2026-03-31 16:31:22.676245
784	893	奶豆腐月饼	0		procure_in_reverse	-10	10	0	CGRK202603315807	采购入库反审核	2026-03-31 16:31:22.688785
785	892	那牧尔酸奶	0		procure_in_reverse	-10	10	0	CGRK202603315807	采购入库反审核	2026-03-31 16:31:22.698355
786	895	黄油渣月饼	0		procure_in_reverse	-10	10	0	CGRK202603315807	采购入库反审核	2026-03-31 16:31:22.708179
787	896	奶皮月饼	0		procure_in_reverse	-10	10	0	CGRK202603315807	采购入库反审核	2026-03-31 16:31:22.718543
788	897	早餐包/那牧尔	0		procure_in_reverse	-10	10	0	CGRK202603315807	采购入库反审核	2026-03-31 16:31:22.72856
789	894	酸奶月饼	0		procure_in_reverse	-10	10	0	CGRK202603315807	采购入库反审核	2026-03-31 16:31:22.738887
792	920	手工乌日末液体	0		procure_in_reverse	-10	30	20	CGRK202603311412	采购入库反审核	2026-03-31 16:31:26.069512
793	917	机器乌日末液体	0		procure_in_reverse	-4	8	4	CGRK202603311412	采购入库反审核	2026-03-31 16:31:26.079324
796	1013	冻炒米/给组装半成品/那牧尔	0		procure_in_reverse	-100	513	413	CGRK202603317749	采购入库反审核	2026-03-31 16:31:30.374366
799	1013	冻炒米/给组装半成品/那牧尔	0		procure_in_reverse	-100	413	313	CGRK202603315380	采购入库反审核	2026-03-31 16:31:34.154284
805	900	透专标签/脆香奶条/微甜	0		procure_in_reverse	-500	1000	500	CGRK202603319871	采购入库反审核	2026-03-31 16:31:41.291531
806	950	透专标签/奶皮卷	0		procure_in_reverse	-500	2000	1500	CGRK202603319871	采购入库反审核	2026-03-31 16:31:41.30045
807	951	透专标签/冻炒米	0		procure_in_reverse	-500	2000	1500	CGRK202603319871	采购入库反审核	2026-03-31 16:31:41.309538
808	952	透专标签/奶酪/原味	0		procure_in_reverse	-500	2000	1500	CGRK202603319871	采购入库反审核	2026-03-31 16:31:41.319816
809	953	透专标签/奶酪/甜味	0		procure_in_reverse	-500	2000	1500	CGRK202603319871	采购入库反审核	2026-03-31 16:31:41.328514
810	956	透专标签/鲜奶皮	0		procure_in_reverse	-500	2000	1500	CGRK202603319871	采购入库反审核	2026-03-31 16:31:41.337232
811	1010	奶油球	0		procure_in_reverse	-20	68	48	CGRK202603316302	采购入库反审核	2026-03-31 16:31:43.500428
813	901	手工白花炒米/散装	0		procure_in_reverse	-30	30	0	CGRK202603316269	采购入库反审核	2026-03-31 16:31:46.533091
814	902	乌日莫糖/散装	0		procure_in_reverse	-5	5	0	CGRK202603316269	采购入库反审核	2026-03-31 16:31:46.54236
815	915	黄油渣/盒	0		procure_in_reverse	-4	12	8	CGRK202603316269	采购入库反审核	2026-03-31 16:31:46.552855
816	981	烤奶皮	0		procure_in_reverse	-10	24	14	CGRK202603316269	采购入库反审核	2026-03-31 16:31:46.562175
817	1013	冻炒米/给组装半成品/那牧尔	0		procure_in_reverse	-100	213	113	CGRK202603314722	采购入库反审核	2026-03-31 16:31:49.143251
824	1010	奶油球	0		procure_in_reverse	-20	48	28	CGRK202603317292	采购入库反审核	2026-03-31 16:31:52.244366
826	923	炒米/散装/硬口	0		procure_in_reverse	-1	2	1	CGRK202603311073	采购入库反审核	2026-03-31 16:31:55.672766
827	922	酸奶炒米糖/散装	0		procure_in_reverse	-1	4	3	CGRK202603315061	采购入库反审核	2026-03-31 16:31:57.668136
828	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-1	4	3	CGRK202603315061	采购入库反审核	2026-03-31 16:31:57.677303
1084	811	蒙古果子/格日勒	0		procure_in	12	0	12	CGRK202603316519	采购入库审核	2026-03-31 16:36:41.20913
728	898	透专标签/奶皮千层	0		procure_in_reverse	-500	500	0	CGRK202603313318	采购入库反审核	2026-03-31 16:30:40.177447
731	884	实惠/奶豆腐	0		procure_in_reverse	-9	9	0	CGRK202603313621	采购入库反审核	2026-03-31 16:30:43.212776
732	920	手工乌日末液体	0		procure_in_reverse	-10	54	44	CGRK202603313621	采购入库反审核	2026-03-31 16:30:43.22285
738	946	半成品/透明/鲜奶皮	0		procure_in_reverse	-40	98	58	CGRK202603312735	采购入库反审核	2026-03-31 16:30:46.300868
739	945	半成品/透明/奶皮卷	0		procure_in_reverse	-50	132	82	CGRK202603312735	采购入库反审核	2026-03-31 16:30:46.310501
740	944	半成品/透明/奶皮千层	0		procure_in_reverse	-20	20	0	CGRK202603312735	采购入库反审核	2026-03-31 16:30:46.319728
741	974	纯净黄油/瓶装好的	0		procure_in_reverse	-35	99	64	CGRK202603312735	采购入库反审核	2026-03-31 16:30:46.328485
742	899	纯净/黄油/斤	0		procure_in_reverse	-10	22	12	CGRK202603312735	采购入库反审核	2026-03-31 16:30:46.337441
743	920	手工乌日末液体	0		procure_in_reverse	-4	44	40	CGRK202603312735	采购入库反审核	2026-03-31 16:30:46.346666
744	968	大/奶皮	0		procure_in_reverse	-30	90	60	CGRK202603312735	采购入库反审核	2026-03-31 16:30:46.356091
746	889	奶皮卷/科尔沁	0		procure_in_reverse	-10	34	24	CGRK202603315278	采购入库反审核	2026-03-31 16:30:49.710722
748	945	半成品/透明/奶皮卷	0		procure_in_reverse	-25	82	57	CGRK202603312304	采购入库反审核	2026-03-31 16:30:53.415714
750	890	红枣	0		procure_in_reverse	-12	24	12	CGRK202603313188	采购入库反审核	2026-03-31 16:30:59.611843
753	916	脆奶条/散装/科尔沁	0		procure_in_reverse	-20	60	40	CGRK202603315580	采购入库反审核	2026-03-31 16:31:02.804205
754	889	奶皮卷/科尔沁	0		procure_in_reverse	-7	14	7	CGRK202603315580	采购入库反审核	2026-03-31 16:31:02.813642
755	886	冻炒米/科尔沁	0		procure_in_reverse	-2	4	2	CGRK202603315580	采购入库反审核	2026-03-31 16:31:02.822656
756	887	羊乳奶粉/奶茶专用	0		procure_in_reverse	-4	8	4	CGRK202603315580	采购入库反审核	2026-03-31 16:31:02.831289
757	888	河套奶粉	0		procure_in_reverse	-4	8	4	CGRK202603315580	采购入库反审核	2026-03-31 16:31:02.840218
759	973	精品/奶豆腐块儿/甜味/	0		procure_in_reverse	-17	57	40	CGRK202603315779	采购入库反审核	2026-03-31 16:31:06.016047
760	986	精品/奶豆腐块儿/原味	0		procure_in_reverse	-50	90	40	CGRK202603315779	采购入库反审核	2026-03-31 16:31:06.025835
766	1014	散装/甜味奶条	0		procure_in_reverse	-23	67	44	CGRK202603314424	采购入库反审核	2026-03-31 16:31:09.702388
768	1014	散装/甜味奶条	0		procure_in_reverse	-23	44	21	CGRK202603314244	采购入库反审核	2026-03-31 16:31:13.530739
770	902	乌日莫糖/散装	0		procure_in_reverse	-5	20	15	CGRK202603313871	采购入库反审核	2026-03-31 16:31:17.063207
771	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-5	14	9	CGRK202603313871	采购入库反审核	2026-03-31 16:31:17.072495
772	922	酸奶炒米糖/散装	0		procure_in_reverse	-5	14	9	CGRK202603313871	采购入库反审核	2026-03-31 16:31:17.081816
780	902	乌日莫糖/散装	0		procure_in_reverse	-5	15	10	CGRK202603313985	采购入库反审核	2026-03-31 16:31:21.030648
781	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-5	9	4	CGRK202603313985	采购入库反审核	2026-03-31 16:31:21.039174
782	922	酸奶炒米糖/散装	0		procure_in_reverse	-5	9	4	CGRK202603313985	采购入库反审核	2026-03-31 16:31:21.047689
790	920	手工乌日末液体	0		procure_in_reverse	-10	40	30	CGRK202603315838	采购入库反审核	2026-03-31 16:31:24.453604
791	917	机器乌日末液体	0		procure_in_reverse	-4	12	8	CGRK202603315838	采购入库反审核	2026-03-31 16:31:24.464554
794	899	纯净/黄油/斤	0		procure_in_reverse	-6	12	6	CGRK202603316842	采购入库反审核	2026-03-31 16:31:27.686262
795	945	半成品/透明/奶皮卷	0		procure_in_reverse	-10	32	22	CGRK202603316842	采购入库反审核	2026-03-31 16:31:27.695899
797	899	纯净/黄油/斤	0		procure_in_reverse	-6	6	0	CGRK202603313127	采购入库反审核	2026-03-31 16:31:32.561255
798	945	半成品/透明/奶皮卷	0		procure_in_reverse	-10	22	12	CGRK202603313127	采购入库反审核	2026-03-31 16:31:32.569965
800	901	手工白花炒米/散装	0		procure_in_reverse	-30	60	30	CGRK202603314294	采购入库反审核	2026-03-31 16:31:35.893745
801	902	乌日莫糖/散装	0		procure_in_reverse	-5	10	5	CGRK202603314294	采购入库反审核	2026-03-31 16:31:35.903218
802	915	黄油渣/盒	0		procure_in_reverse	-4	16	12	CGRK202603314294	采购入库反审核	2026-03-31 16:31:35.912257
803	981	烤奶皮	0		procure_in_reverse	-10	34	24	CGRK202603314294	采购入库反审核	2026-03-31 16:31:35.922884
804	1013	冻炒米/给组装半成品/那牧尔	0		procure_in_reverse	-100	313	213	CGRK202603318659	采购入库反审核	2026-03-31 16:31:39.759547
812	929	白砂糖	0		procure_in_reverse	-6	16	10	CGRK202603314799	采购入库反审核	2026-03-31 16:31:45.030272
818	900	透专标签/脆香奶条/微甜	0		procure_in_reverse	-500	500	0	CGRK202603315560	采购入库反审核	2026-03-31 16:31:50.683369
819	950	透专标签/奶皮卷	0		procure_in_reverse	-500	1500	1000	CGRK202603315560	采购入库反审核	2026-03-31 16:31:50.692657
820	951	透专标签/冻炒米	0		procure_in_reverse	-500	1500	1000	CGRK202603315560	采购入库反审核	2026-03-31 16:31:50.701457
821	952	透专标签/奶酪/原味	0		procure_in_reverse	-500	1500	1000	CGRK202603315560	采购入库反审核	2026-03-31 16:31:50.712778
822	953	透专标签/奶酪/甜味	0		procure_in_reverse	-500	1500	1000	CGRK202603315560	采购入库反审核	2026-03-31 16:31:50.722022
823	956	透专标签/鲜奶皮	0		procure_in_reverse	-500	1500	1000	CGRK202603315560	采购入库反审核	2026-03-31 16:31:50.73102
825	929	白砂糖	0		procure_in_reverse	-6	10	4	CGRK202603314637	采购入库反审核	2026-03-31 16:31:53.754676
829	907	风干牛肉500g大片	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-03-31 16:31:59.455418
830	908	哈斯乌拉牛肉干500g原味	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-03-31 16:31:59.464932
831	909	蓝旗绿乳糖惠虹糖	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-03-31 16:31:59.473648
832	910	蓝旗绿乳糖奶香酥	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-03-31 16:31:59.482022
833	911	蓝旗绿乳糖果仁酥	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-03-31 16:31:59.490655
834	912	蓝旗绿乳糖水果	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-03-31 16:31:59.499621
835	913	蓝旗绿乳糖黄油球	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-03-31 16:31:59.508469
836	914	蓝旗绿乳糖炼乳	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-03-31 16:31:59.518033
837	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-1	3	2	CGRK202603316985	采购入库反审核	2026-03-31 16:31:59.526652
838	922	酸奶炒米糖/散装	0		procure_in_reverse	-1	3	2	CGRK202603316985	采购入库反审核	2026-03-31 16:31:59.535083
839	915	黄油渣/盒	0		procure_in_reverse	-4	8	4	CGRK202603316985	采购入库反审核	2026-03-31 16:31:59.546507
840	916	脆奶条/散装/科尔沁	0		procure_in_reverse	-10	20	10	CGRK202603316985	采购入库反审核	2026-03-31 16:31:59.555281
841	905	真空奶豆腐砖/甜味	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-03-31 16:31:59.563717
842	906	真空奶豆腐砖/原味	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-03-31 16:31:59.572467
843	903	盛宇燃奶豆腐/甜味	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-03-31 16:31:59.581174
844	904	盛宇燃奶豆腐/原味	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-03-31 16:31:59.589836
846	922	酸奶炒米糖/散装	0		procure_in_reverse	-1	2	1	CGRK202603318149	采购入库反审核	2026-03-31 16:32:03.27264
847	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-1	2	1	CGRK202603318149	采购入库反审核	2026-03-31 16:32:03.283624
869	873	专袋/牛肉干包装	0		procure_in_reverse	-3000	3000	0	CGRK202603317882	采购入库反审核	2026-03-31 16:32:10.396657
875	949	专袋/乌日莫/炒米	0		procure_in_reverse	-100	200	100	CGRK202603315624	采购入库反审核	2026-03-31 16:32:13.743079
876	948	专袋/乌日莫	0		procure_in_reverse	-100	200	100	CGRK202603315624	采购入库反审核	2026-03-31 16:32:13.751924
878	930	加沙奶豆腐	0		procure_in_reverse	-5	10	5	CGRK202603318023	采购入库反审核	2026-03-31 16:32:17.529397
879	931	炒米粉/aag	0		procure_in_reverse	-10	20	10	CGRK202603318023	采购入库反审核	2026-03-31 16:32:17.53858
880	932	炒米海丰	0		procure_in_reverse	-10	20	10	CGRK202603318023	采购入库反审核	2026-03-31 16:32:17.547125
884	926	大奶豆腐砖/1.2斤	0		procure_in_reverse	-19	38	19	CGRK202603313193	采购入库反审核	2026-03-31 16:32:21.226737
885	927	小奶豆腐砖/1斤	0		procure_in_reverse	-20	40	20	CGRK202603313193	采购入库反审核	2026-03-31 16:32:21.235991
886	925	小/无印花/奶豆腐砖/1斤	0		procure_in_reverse	-20	40	20	CGRK202603313193	采购入库反审核	2026-03-31 16:32:21.244561
887	946	半成品/透明/鲜奶皮	0		procure_in_reverse	-29	58	29	CGRK202603313193	采购入库反审核	2026-03-31 16:32:21.253447
888	945	半成品/透明/奶皮卷	0		procure_in_reverse	-6	12	6	CGRK202603313193	采购入库反审核	2026-03-31 16:32:21.262166
889	939	半成品/透明/原味/鲜奶酪	0		procure_in_reverse	-40	80	40	CGRK202603313193	采购入库反审核	2026-03-31 16:32:21.27082
890	940	半成品/透明/甜味/鲜奶酪	0		procure_in_reverse	-40	80	40	CGRK202603313193	采购入库反审核	2026-03-31 16:32:21.279667
893	1013	冻炒米/给组装半成品/那牧尔	0		procure_in_reverse	-40	73	33	CGRK202603316103	采购入库反审核	2026-03-31 16:32:25.686762
1570	902	乌日莫糖/散装	0		procure_in_reverse	-5	30	25	CGRK202603314400	采购入库反审核	2026-04-03 07:14:53.662911
1571	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-5	44	39	CGRK202603319747	采购入库反审核	2026-04-03 07:14:55.119565
1572	922	酸奶炒米糖/散装	0		procure_in_reverse	-5	24	19	CGRK202603318354	采购入库反审核	2026-04-03 07:14:56.57876
1574	981	烤奶皮	0		procure_in_reverse	-10	114	104	CGRK202603315191	采购入库反审核	2026-04-03 07:14:59.306393
1576	804	德吉酸奶/2斤装	0		procure_in_reverse	-10	10	0	CGRK202603316167	采购入库反审核	2026-04-03 07:15:02.132908
1577	805	德吉酸奶/一斤装	0		procure_in_reverse	-10	10	0	CGRK202603316167	采购入库反审核	2026-04-03 07:15:02.142612
1578	806	德吉酸奶/半斤	0		procure_in_reverse	-10	10	0	CGRK202603316167	采购入库反审核	2026-04-03 07:15:02.152867
1580	908	哈斯乌拉牛肉干500g原味	0		procure_in_reverse	-10	19	9	CGRK202603317521	采购入库反审核	2026-04-03 07:15:04.866353
1585	907	风干牛肉500g大片	0		procure_in_reverse	-5	13	8	CGRK202603313556	采购入库反审核	2026-04-03 07:15:07.712797
1586	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-5	39	34	CGRK202603313556	采购入库反审核	2026-04-03 07:15:07.722256
1587	932	炒米海丰	0		procure_in_reverse	-20	40	20	CGRK202603313556	采购入库反审核	2026-04-03 07:15:07.733776
1588	931	炒米粉/aag	0		procure_in_reverse	-10	40	30	CGRK202603313556	采购入库反审核	2026-04-03 07:15:07.743535
1589	823	黄油/中瓶	0		procure_in_reverse	-10	15	5	CGRK202603313556	采购入库反审核	2026-04-03 07:15:07.762627
1598	923	炒米/散装/硬口	0		procure_in_reverse	-30	34	4	CGRK202603313924	采购入库反审核	2026-04-03 07:15:10.574635
1600	825	故乡宝酸马奶	0		procure_in_reverse	-3	3	0	CGRK202603315252	采购入库反审核	2026-04-03 07:15:13.46889
1601	826	乌日汗酸奶	0		procure_in_reverse	-5	5	0	CGRK202603315252	采购入库反审核	2026-04-03 07:15:13.477222
1603	901	手工白花炒米/散装	0		procure_in_reverse	-30	120	90	CGRK202603312902	采购入库反审核	2026-04-03 07:15:16.459817
1607	857	厚奶皮	0		procure_in_reverse	-20	30	10	CGRK202603317175	采购入库反审核	2026-04-03 07:15:19.142098
1609	981	烤奶皮	0		procure_in_reverse	-40	104	64	CGRK202603317026	采购入库反审核	2026-04-03 07:15:21.811379
1610	903	盛宇燃奶豆腐/甜味	0		procure_in_reverse	-3	7	4	CGRK202603317026	采购入库反审核	2026-04-03 07:15:21.820633
1611	904	盛宇燃奶豆腐/原味	0		procure_in_reverse	-4	8	4	CGRK202603317026	采购入库反审核	2026-04-03 07:15:21.829356
1612	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-10	34	24	CGRK202603317026	采购入库反审核	2026-04-03 07:15:21.838652
1614	880	阿润月饼/五仁馅	0		procure_in_reverse	-10	18	8	CGRK202603311146	采购入库反审核	2026-04-03 07:15:24.619403
1615	882	阿润月饼/黄油渣馅	0		procure_in_reverse	-5	13	8	CGRK202603311146	采购入库反审核	2026-04-03 07:15:24.62776
1616	831	果条/阿润	0		procure_in_reverse	-5	5	0	CGRK202603311146	采购入库反审核	2026-04-03 07:15:24.636801
1618	845	乳清饮料	0		procure_in_reverse	-20	20	0	CGRK202603318569	采购入库反审核	2026-04-03 07:15:27.309798
1619	846	酸奶/额吉伊德	0		procure_in_reverse	-6	6	0	CGRK202603318569	采购入库反审核	2026-04-03 07:15:27.318292
1620	847	乌日莫/袋装	0		procure_in_reverse	-5	5	0	CGRK202603318569	采购入库反审核	2026-04-03 07:15:27.327805
1630	836	礼盒/2026	0		procure_in_reverse	-540	540	0	CGRK202603315542	采购入库反审核	2026-04-03 07:15:30.129057
1663	907	风干牛肉500g大片	0		procure_in_reverse	-2	6	4	CGRK202603311529	采购入库反审核	2026-04-03 07:15:59.007333
1674	863	冻炒米/小包散/精品	0		procure_in_reverse	-100	100	0	CGRK202603316444	采购入库反审核	2026-04-03 07:16:07.864601
1678	870	大青砖茶砖	0		procure_in_reverse	-1	1	0	CGRK202603312281	采购入库反审核	2026-04-03 07:16:10.619804
1679	871	小青砖茶砖	0		procure_in_reverse	-1	1	0	CGRK202603312281	采购入库反审核	2026-04-03 07:16:10.629086
845	923	炒米/散装/硬口	0		procure_in_reverse	-1	1	0	CGRK202603317247	采购入库反审核	2026-03-31 16:32:01.295575
848	907	风干牛肉500g大片	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-03-31 16:32:04.838839
849	908	哈斯乌拉牛肉干500g原味	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-03-31 16:32:04.848315
850	909	蓝旗绿乳糖惠虹糖	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-03-31 16:32:04.856574
851	910	蓝旗绿乳糖奶香酥	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-03-31 16:32:04.865606
852	911	蓝旗绿乳糖果仁酥	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-03-31 16:32:04.874535
853	912	蓝旗绿乳糖水果	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-03-31 16:32:04.883018
854	913	蓝旗绿乳糖黄油球	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-03-31 16:32:04.891419
855	914	蓝旗绿乳糖炼乳	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-03-31 16:32:04.905055
856	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-1	1	0	CGRK202603312692	采购入库反审核	2026-03-31 16:32:04.915849
857	922	酸奶炒米糖/散装	0		procure_in_reverse	-1	1	0	CGRK202603312692	采购入库反审核	2026-03-31 16:32:04.925195
858	915	黄油渣/盒	0		procure_in_reverse	-4	4	0	CGRK202603312692	采购入库反审核	2026-03-31 16:32:04.934232
859	916	脆奶条/散装/科尔沁	0		procure_in_reverse	-10	10	0	CGRK202603312692	采购入库反审核	2026-03-31 16:32:04.945852
860	905	真空奶豆腐砖/甜味	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-03-31 16:32:04.956521
861	906	真空奶豆腐砖/原味	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-03-31 16:32:04.965488
862	903	盛宇燃奶豆腐/甜味	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-03-31 16:32:04.974206
863	904	盛宇燃奶豆腐/原味	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-03-31 16:32:04.983678
864	924	冻炒米/袋装	0		procure_in_reverse	-5	10	5	CGRK202603312165	采购入库反审核	2026-03-31 16:32:07.212275
865	917	机器乌日末液体	0		procure_in_reverse	-2	4	2	CGRK202603312165	采购入库反审核	2026-03-31 16:32:07.221826
866	920	手工乌日末液体	0		procure_in_reverse	-10	20	10	CGRK202603312165	采购入库反审核	2026-03-31 16:32:07.231235
867	918	黄油/半斤	0		procure_in_reverse	-2	4	2	CGRK202603312165	采购入库反审核	2026-03-31 16:32:07.240453
868	919	黄油/斤	0		procure_in_reverse	-4	8	4	CGRK202603312165	采购入库反审核	2026-03-31 16:32:07.287291
870	924	冻炒米/袋装	0		procure_in_reverse	-5	5	0	CGRK202603317772	采购入库反审核	2026-03-31 16:32:11.910207
871	917	机器乌日末液体	0		procure_in_reverse	-2	2	0	CGRK202603317772	采购入库反审核	2026-03-31 16:32:11.919478
872	920	手工乌日末液体	0		procure_in_reverse	-10	10	0	CGRK202603317772	采购入库反审核	2026-03-31 16:32:11.928057
873	918	黄油/半斤	0		procure_in_reverse	-2	2	0	CGRK202603317772	采购入库反审核	2026-03-31 16:32:11.939288
874	919	黄油/斤	0		procure_in_reverse	-4	4	0	CGRK202603317772	采购入库反审核	2026-03-31 16:32:11.994465
877	1013	冻炒米/给组装半成品/那牧尔	0		procure_in_reverse	-40	113	73	CGRK202603318027	采购入库反审核	2026-03-31 16:32:15.603886
881	929	白砂糖	0		procure_in_reverse	-2	4	2	CGRK202603317210	采购入库反审核	2026-03-31 16:32:19.156848
882	1002	封口机/真空	0		procure_in_reverse	-1	3	2	CGRK202603317210	采购入库反审核	2026-03-31 16:32:19.166177
883	928	塑料购物袋	0		procure_in_reverse	-300	600	300	CGRK202603317210	采购入库反审核	2026-03-31 16:32:19.174839
891	949	专袋/乌日莫/炒米	0		procure_in_reverse	-100	100	0	CGRK202603311851	采购入库反审核	2026-03-31 16:32:22.979977
892	948	专袋/乌日莫	0		procure_in_reverse	-100	100	0	CGRK202603311851	采购入库反审核	2026-03-31 16:32:22.990474
894	930	加沙奶豆腐	0		procure_in_reverse	-5	5	0	CGRK202603313573	采购入库反审核	2026-03-31 16:32:27.44475
895	931	炒米粉/aag	0		procure_in_reverse	-10	10	0	CGRK202603313573	采购入库反审核	2026-03-31 16:32:27.454089
896	932	炒米海丰	0		procure_in_reverse	-10	10	0	CGRK202603313573	采购入库反审核	2026-03-31 16:32:27.462821
897	929	白砂糖	0		procure_in_reverse	-2	2	0	CGRK202603314923	采购入库反审核	2026-03-31 16:32:29.024631
898	1002	封口机/真空	0		procure_in_reverse	-1	2	1	CGRK202603314923	采购入库反审核	2026-03-31 16:32:29.033238
899	928	塑料购物袋	0		procure_in_reverse	-300	300	0	CGRK202603314923	采购入库反审核	2026-03-31 16:32:29.042788
900	926	大奶豆腐砖/1.2斤	0		procure_in_reverse	-19	19	0	CGRK202603316519	采购入库反审核	2026-03-31 16:32:30.561638
901	927	小奶豆腐砖/1斤	0		procure_in_reverse	-20	20	0	CGRK202603316519	采购入库反审核	2026-03-31 16:32:30.570775
902	925	小/无印花/奶豆腐砖/1斤	0		procure_in_reverse	-20	20	0	CGRK202603316519	采购入库反审核	2026-03-31 16:32:30.579069
903	946	半成品/透明/鲜奶皮	0		procure_in_reverse	-29	29	0	CGRK202603316519	采购入库反审核	2026-03-31 16:32:30.587792
904	945	半成品/透明/奶皮卷	0		procure_in_reverse	-6	6	0	CGRK202603316519	采购入库反审核	2026-03-31 16:32:30.596571
905	939	半成品/透明/原味/鲜奶酪	0		procure_in_reverse	-40	40	0	CGRK202603316519	采购入库反审核	2026-03-31 16:32:30.60509
906	940	半成品/透明/甜味/鲜奶酪	0		procure_in_reverse	-40	40	0	CGRK202603316519	采购入库反审核	2026-03-31 16:32:30.61344
907	981	烤奶皮	0		procure_in_reverse	-7	14	7	CGRK202603312723	采购入库反审核	2026-03-31 16:32:32.470154
908	973	精品/奶豆腐块儿/甜味/	0		procure_in_reverse	-20	40	20	CGRK202603316782	采购入库反审核	2026-03-31 16:32:34.164159
909	986	精品/奶豆腐块儿/原味	0		procure_in_reverse	-20	40	20	CGRK202603316782	采购入库反审核	2026-03-31 16:32:34.174524
910	974	纯净黄油/瓶装好的	0		procure_in_reverse	-32	64	32	CGRK202603316782	采购入库反审核	2026-03-31 16:32:34.183518
911	963	小/方形/亚克力盒/	0		procure_in_reverse	-240	480	240	CGRK202603316560	采购入库反审核	2026-03-31 16:32:35.857124
912	962	中/方形/亚克力盒/	0		procure_in_reverse	-258	516	258	CGRK202603316560	采购入库反审核	2026-03-31 16:32:35.867027
913	960	三角/奶皮千层盒	0		procure_in_reverse	-200	400	200	CGRK202603316560	采购入库反审核	2026-03-31 16:32:35.878678
914	961	扁盒/亚克力/带内托	0		procure_in_reverse	-300	600	300	CGRK202603316560	采购入库反审核	2026-03-31 16:32:35.888294
915	959	大/牛薄脆盒/亚克力	0		procure_in_reverse	-246	492	246	CGRK202603316560	采购入库反审核	2026-03-31 16:32:35.897687
918	979	新茶包/纸	0		procure_in_reverse	-20000	40000	20000	CGRK202603312482	采购入库反审核	2026-03-31 16:32:37.530111
916	958	小/长方/亚克力/乳清奶条盒	0		procure_in_reverse	-183	366	183	CGRK202603316560	采购入库反审核	2026-03-31 16:32:35.906584
917	957	大/长方/亚克力/待用	0		procure_in_reverse	-180	360	180	CGRK202603316560	采购入库反审核	2026-03-31 16:32:35.915659
927	981	烤奶皮	0		procure_in_reverse	-7	7	0	CGRK202603317710	采购入库反审核	2026-03-31 16:32:39.298475
931	963	小/方形/亚克力盒/	0		procure_in_reverse	-240	240	0	CGRK202603318706	采购入库反审核	2026-03-31 16:32:43.188044
932	962	中/方形/亚克力盒/	0		procure_in_reverse	-258	258	0	CGRK202603318706	采购入库反审核	2026-03-31 16:32:43.196974
933	960	三角/奶皮千层盒	0		procure_in_reverse	-200	200	0	CGRK202603318706	采购入库反审核	2026-03-31 16:32:43.205556
934	961	扁盒/亚克力/带内托	0		procure_in_reverse	-300	300	0	CGRK202603318706	采购入库反审核	2026-03-31 16:32:43.214525
935	959	大/牛薄脆盒/亚克力	0		procure_in_reverse	-246	246	0	CGRK202603318706	采购入库反审核	2026-03-31 16:32:43.223641
936	958	小/长方/亚克力/乳清奶条盒	0		procure_in_reverse	-183	183	0	CGRK202603318706	采购入库反审核	2026-03-31 16:32:43.233358
937	957	大/长方/亚克力/待用	0		procure_in_reverse	-180	180	0	CGRK202603318706	采购入库反审核	2026-03-31 16:32:43.242414
938	979	新茶包/纸	0		procure_in_reverse	-20000	20000	0	CGRK202603319374	采购入库反审核	2026-03-31 16:32:44.770031
939	1020	标签/不干胶/奶果子	0		procure_in_reverse	-500	624	124	CGRK202603319374	采购入库反审核	2026-03-31 16:32:44.783801
940	950	透专标签/奶皮卷	0		procure_in_reverse	-500	500	0	CGRK202603319374	采购入库反审核	2026-03-31 16:32:44.795102
941	951	透专标签/冻炒米	0		procure_in_reverse	-500	500	0	CGRK202603319374	采购入库反审核	2026-03-31 16:32:44.806467
942	952	透专标签/奶酪/原味	0		procure_in_reverse	-500	500	0	CGRK202603319374	采购入库反审核	2026-03-31 16:32:44.815897
943	953	透专标签/奶酪/甜味	0		procure_in_reverse	-500	500	0	CGRK202603319374	采购入库反审核	2026-03-31 16:32:44.825183
944	954	透专标签/乳清奶条/甜味	0		procure_in_reverse	-500	500	0	CGRK202603319374	采购入库反审核	2026-03-31 16:32:44.835308
945	955	透专标签/乳清奶条/原味	0		procure_in_reverse	-500	500	0	CGRK202603319374	采购入库反审核	2026-03-31 16:32:44.844061
946	956	透专标签/鲜奶皮	0		procure_in_reverse	-500	500	0	CGRK202603319374	采购入库反审核	2026-03-31 16:32:44.852711
955	972	原味/散称/奶豆腐块儿	0		procure_in_reverse	-10	10	0	CGRK202603317488	采购入库反审核	2026-03-31 16:32:49.067838
956	971	甜味/散称/奶豆腐块儿	0		procure_in_reverse	-10	10	0	CGRK202603317488	采购入库反审核	2026-03-31 16:32:49.077007
957	965	半成品/透明/冻炒米	0		procure_in_reverse	-38	38	0	CGRK202603317488	采购入库反审核	2026-03-31 16:32:49.085713
958	970	热奶豆腐碗	0		procure_in_reverse	-50	50	0	CGRK202603317488	采购入库反审核	2026-03-31 16:32:49.09411
959	968	大/奶皮	0		procure_in_reverse	-30	30	0	CGRK202603317488	采购入库反审核	2026-03-31 16:32:49.102766
960	969	小/奶皮	0		procure_in_reverse	-30	30	0	CGRK202603317488	采购入库反审核	2026-03-31 16:32:49.111741
961	967	查嘎/乳清	0		procure_in_reverse	-5	5	0	CGRK202603317488	采购入库反审核	2026-03-31 16:32:49.120783
962	966	查嘎粉/小包装袋	0		procure_in_reverse	-30	30	0	CGRK202603317488	采购入库反审核	2026-03-31 16:32:49.129704
964	1016	专瓶/黄油	0		procure_in_reverse	-240	535	295	CGRK202603312940	采购入库反审核	2026-03-31 16:32:52.981871
965	862	专瓶/黄油渣	0		procure_in_reverse	-120	240	120	CGRK202603312940	采购入库反审核	2026-03-31 16:32:52.993898
968	1016	专瓶/黄油	0		procure_in_reverse	-240	295	55	CGRK202603312017	采购入库反审核	2026-03-31 16:32:58.514615
969	862	专瓶/黄油渣	0		procure_in_reverse	-120	120	0	CGRK202603312017	采购入库反审核	2026-03-31 16:32:58.523238
971	1014	散装/甜味奶条	0		procure_in_reverse	-21	21	0	CGRK202603317227	采购入库反审核	2026-03-31 16:33:04.940343
973	995	茶专用/热缩膜	0		procure_in_reverse	-2600	2610	10	CGRK202603314460	采购入库反审核	2026-03-31 16:33:09.308427
974	1002	封口机/真空	0		procure_in_reverse	-1	1	0	CGRK202603312389	采购入库反审核	2026-03-31 16:33:11.133497
976	1019	标签/不干胶/冻炒米	0		procure_in_reverse	-500	1500	1000	CGRK202603318283	采购入库反审核	2026-03-31 16:33:14.37091
977	984	茶包/类腰封纸	0		procure_in_reverse	-2000	4000	2000	CGRK202603318283	采购入库反审核	2026-03-31 16:33:14.379579
978	975	黄油脖签	0		procure_in_reverse	-500	1000	500	CGRK202603318283	采购入库反审核	2026-03-31 16:33:14.38858
979	978	新茶专用标签纸	0		procure_in_reverse	-3000	6000	3000	CGRK202603318283	采购入库反审核	2026-03-31 16:33:14.397259
983	1019	标签/不干胶/冻炒米	0		procure_in_reverse	-500	1000	500	CGRK202603317281	采购入库反审核	2026-03-31 16:33:17.407989
984	984	茶包/类腰封纸	0		procure_in_reverse	-2000	2000	0	CGRK202603317281	采购入库反审核	2026-03-31 16:33:17.416561
985	975	黄油脖签	0		procure_in_reverse	-500	500	0	CGRK202603317281	采购入库反审核	2026-03-31 16:33:17.42533
986	978	新茶专用标签纸	0		procure_in_reverse	-3000	3000	0	CGRK202603317281	采购入库反审核	2026-03-31 16:33:17.434808
990	1010	奶油球	0		procure_in_reverse	-10	28	18	CGRK202603314211	采购入库反审核	2026-03-31 16:33:20.54014
992	989	蒙古黄油/瓶装成品	0		procure_in_reverse	-1	3	2	CGRK202603312720	采购入库反审核	2026-03-31 16:33:24.484586
993	989	蒙古黄油/瓶装成品	0		procure_in_reverse	-2	2	0	CGRK202603312720	采购入库反审核	2026-03-31 16:33:24.493235
994	988	原味传统奶豆腐/成品袋装	0		procure_in_reverse	-2	2	0	CGRK202603312720	采购入库反审核	2026-03-31 16:33:24.501902
996	1013	冻炒米/给组装半成品/那牧尔	0		procure_in_reverse	-3	33	30	CGRK202603315166	采购入库反审核	2026-03-31 16:33:27.69068
998	987	采购样品专用/乳制品	0		procure_in_reverse	-14	14	0	CGRK202603312742	采购入库反审核	2026-03-31 16:33:31.386421
1000	1013	冻炒米/给组装半成品/那牧尔	0		procure_in_reverse	-30	30	0	CGRK202603311843	采购入库反审核	2026-03-31 16:33:39.475233
1001	1009	专盒/青砖奶茶外盒	0		procure_in_reverse	-3030	3230	200	CGRK202603317409	采购入库反审核	2026-03-31 16:33:43.112571
1004	1011	茶包	0		procure_in_reverse	-8	8	0	CGRK202603311827	采购入库反审核	2026-03-31 16:33:49.927976
1007	1000	木勺	0		procure_in_reverse	-2	202	200	CGRK202603317862	采购入库反审核	2026-03-31 16:33:54.242904
1008	1000	木勺	0		procure_in_reverse	-200	200	0	CGRK202603317862	采购入库反审核	2026-03-31 16:33:54.252631
1011	995	茶专用/热缩膜	0		procure_in_reverse	-10	10	0	CGRK202603312868	采购入库反审核	2026-03-31 16:33:57.651743
1012	1009	专盒/青砖奶茶外盒	0		procure_in_reverse	-200	200	0	CGRK202603318063	采购入库反审核	2026-03-31 16:33:59.336934
1020	1031	专底盒/奶条	0		procure_in_reverse	-30	186	156	CGRK202603319931	采购入库反审核	2026-03-31 16:34:10.208034
919	1020	标签/不干胶/奶果子	0		procure_in_reverse	-500	1124	624	CGRK202603312482	采购入库反审核	2026-03-31 16:32:37.538973
920	950	透专标签/奶皮卷	0		procure_in_reverse	-500	1000	500	CGRK202603312482	采购入库反审核	2026-03-31 16:32:37.548476
921	951	透专标签/冻炒米	0		procure_in_reverse	-500	1000	500	CGRK202603312482	采购入库反审核	2026-03-31 16:32:37.557725
922	952	透专标签/奶酪/原味	0		procure_in_reverse	-500	1000	500	CGRK202603312482	采购入库反审核	2026-03-31 16:32:37.566389
923	953	透专标签/奶酪/甜味	0		procure_in_reverse	-500	1000	500	CGRK202603312482	采购入库反审核	2026-03-31 16:32:37.575181
924	954	透专标签/乳清奶条/甜味	0		procure_in_reverse	-500	1000	500	CGRK202603312482	采购入库反审核	2026-03-31 16:32:37.584075
925	955	透专标签/乳清奶条/原味	0		procure_in_reverse	-500	1000	500	CGRK202603312482	采购入库反审核	2026-03-31 16:32:37.59259
926	956	透专标签/鲜奶皮	0		procure_in_reverse	-500	1000	500	CGRK202603312482	采购入库反审核	2026-03-31 16:32:37.601021
928	973	精品/奶豆腐块儿/甜味/	0		procure_in_reverse	-20	20	0	CGRK202603318332	采购入库反审核	2026-03-31 16:32:41.221256
929	986	精品/奶豆腐块儿/原味	0		procure_in_reverse	-20	20	0	CGRK202603318332	采购入库反审核	2026-03-31 16:32:41.230279
930	974	纯净黄油/瓶装好的	0		procure_in_reverse	-32	32	0	CGRK202603318332	采购入库反审核	2026-03-31 16:32:41.239635
947	972	原味/散称/奶豆腐块儿	0		procure_in_reverse	-10	20	10	CGRK202603318436	采购入库反审核	2026-03-31 16:32:46.87852
948	971	甜味/散称/奶豆腐块儿	0		procure_in_reverse	-10	20	10	CGRK202603318436	采购入库反审核	2026-03-31 16:32:46.888331
949	965	半成品/透明/冻炒米	0		procure_in_reverse	-38	76	38	CGRK202603318436	采购入库反审核	2026-03-31 16:32:46.897502
950	970	热奶豆腐碗	0		procure_in_reverse	-50	100	50	CGRK202603318436	采购入库反审核	2026-03-31 16:32:46.906629
951	968	大/奶皮	0		procure_in_reverse	-30	60	30	CGRK202603318436	采购入库反审核	2026-03-31 16:32:46.915824
952	969	小/奶皮	0		procure_in_reverse	-30	60	30	CGRK202603318436	采购入库反审核	2026-03-31 16:32:46.924955
953	967	查嘎/乳清	0		procure_in_reverse	-5	10	5	CGRK202603318436	采购入库反审核	2026-03-31 16:32:46.933832
954	966	查嘎粉/小包装袋	0		procure_in_reverse	-30	60	30	CGRK202603318436	采购入库反审核	2026-03-31 16:32:46.943318
963	982	塑料手提袋	0		procure_in_reverse	-5000	10000	5000	CGRK202603316912	采购入库反审核	2026-03-31 16:32:50.923147
966	1027	真空袋	0		procure_in_reverse	-500	1080	580	CGRK202603313044	采购入库反审核	2026-03-31 16:32:54.65085
967	982	塑料手提袋	0		procure_in_reverse	-5000	5000	0	CGRK202603317738	采购入库反审核	2026-03-31 16:32:56.551153
970	1027	真空袋	0		procure_in_reverse	-500	580	80	CGRK202603312344	采购入库反审核	2026-03-31 16:33:00.632397
972	1000	木勺	0		procure_in_reverse	-10	212	202	CGRK202603317084	采购入库反审核	2026-03-31 16:33:07.423137
975	1001	冷冻柜/冰箱	0		procure_in_reverse	-1	1	0	CGRK202603317776	采购入库反审核	2026-03-31 16:33:12.915217
980	983	甜味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-25	50	25	CGRK202603311075	采购入库反审核	2026-03-31 16:33:15.913245
981	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-25	1190	1165	CGRK202603311075	采购入库反审核	2026-03-31 16:33:15.922392
982	999	茶专用/不干胶/标签	0		procure_in_reverse	-60	1120	1060	CGRK202603311075	采购入库反审核	2026-03-31 16:33:15.931831
987	983	甜味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-25	25	0	CGRK202603313456	采购入库反审核	2026-03-31 16:33:18.893227
988	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-25	1165	1140	CGRK202603313456	采购入库反审核	2026-03-31 16:33:18.902733
989	999	茶专用/不干胶/标签	0		procure_in_reverse	-60	1060	1000	CGRK202603313456	采购入库反审核	2026-03-31 16:33:18.911881
991	997	茶专用/盐包	0		procure_in_reverse	-8	3770	3762	CGRK202603312404	采购入库反审核	2026-03-31 16:33:22.896418
995	997	茶专用/盐包	0		procure_in_reverse	-3560	3762	202	CGRK202603319814	采购入库反审核	2026-03-31 16:33:26.063663
997	1010	奶油球	0		procure_in_reverse	-10	18	8	CGRK202603315724	采购入库反审核	2026-03-31 16:33:29.831661
999	1003	热收缩膜机	0		procure_in_reverse	-1	1	0	CGRK202603313416	采购入库反审核	2026-03-31 16:33:33.286399
1002	1015	散装/原味奶条	0		procure_in_reverse	-15	15	0	CGRK202603315894	采购入库反审核	2026-03-31 16:33:45.657471
1003	1010	奶油球	0		procure_in_reverse	-8	8	0	CGRK202603316571	采购入库反审核	2026-03-31 16:33:47.556437
1005	997	茶专用/盐包	0		procure_in_reverse	-2	202	200	CGRK202603314744	采购入库反审核	2026-03-31 16:33:52.074626
1006	997	茶专用/盐包	0		procure_in_reverse	-200	200	0	CGRK202603314744	采购入库反审核	2026-03-31 16:33:52.08324
1009	998	茶专用/硫酸纸	0		procure_in_reverse	-1000	1000	0	CGRK202603315535	采购入库反审核	2026-03-31 16:33:55.909246
1010	999	茶专用/不干胶/标签	0		procure_in_reverse	-1000	1000	0	CGRK202603315535	采购入库反审核	2026-03-31 16:33:55.918129
1013	993	冻炒米专用/塑膜袋	0		procure_in_reverse	-500	500	0	CGRK202603311837	采购入库反审核	2026-03-31 16:34:01.600896
1014	990	奶果子/专用塑膜袋	0		procure_in_reverse	-1000	1000	0	CGRK202603317539	采购入库反审核	2026-03-31 16:34:04.158111
1015	1033	专袋/奶条	0		procure_in_reverse	-51	463	412	CGRK202603318453	采购入库反审核	2026-03-31 16:34:07.129086
1016	1033	专袋/奶条	0		procure_in_reverse	-84	412	328	CGRK202603318453	采购入库反审核	2026-03-31 16:34:07.138226
1017	1033	专袋/奶条	0		procure_in_reverse	-2	328	326	CGRK202603318453	采购入库反审核	2026-03-31 16:34:07.147292
1018	1033	专袋/奶条	0		procure_in_reverse	-48	326	278	CGRK202603318453	采购入库反审核	2026-03-31 16:34:07.156026
1019	1032	专盒/冻炒米	0		procure_in_reverse	-32	1738	1706	CGRK202603311619	采购入库反审核	2026-03-31 16:34:08.75827
1022	1029	专内盒/奶果子	0		procure_in_reverse	-8	69	61	CGRK202603311805	采购入库反审核	2026-03-31 16:34:11.717396
1023	1030	专外盒/奶果子	0		procure_in_reverse	-6	46	40	CGRK202603311805	采购入库反审核	2026-03-31 16:34:11.727635
1025	1027	真空袋	0		procure_in_reverse	-60	80	20	CGRK202603316109	采购入库反审核	2026-03-31 16:34:14.985209
1028	1025	定制款/专内袋/扎那家奶果子	0		procure_in_reverse	-16	186	170	CGRK202603318163	采购入库反审核	2026-03-31 16:34:19.527687
1029	1025	定制款/专内袋/扎那家奶果子	0		procure_in_reverse	-170	170	0	CGRK202603318163	采购入库反审核	2026-03-31 16:34:19.53705
1035	1020	标签/不干胶/奶果子	0		procure_in_reverse	-13	124	111	CGRK202603311132	采购入库反审核	2026-03-31 16:34:27.025167
1573	920	手工乌日末液体	0		procure_in_reverse	-10	128	118	CGRK202603314800	采购入库反审核	2026-04-03 07:14:57.934413
1575	857	厚奶皮	0		procure_in_reverse	-20	50	30	CGRK202603312834	采购入库反审核	2026-04-03 07:15:00.71329
1021	1031	专底盒/奶条	0		procure_in_reverse	-3	156	153	CGRK202603319931	采购入库反审核	2026-03-31 16:34:10.21672
1024	1028	专标签/黄油	0		procure_in_reverse	-16	856	840	CGRK202603318955	采购入库反审核	2026-03-31 16:34:13.391605
1026	1026	专内袋/奶果子	0		procure_in_reverse	-16	136	120	CGRK202603318147	采购入库反审核	2026-03-31 16:34:17.496038
1027	1026	专内袋/奶果子	0		procure_in_reverse	-13	120	107	CGRK202603318147	采购入库反审核	2026-03-31 16:34:17.504597
1030	1024	标签/不干胶/奶条/甜味	0		procure_in_reverse	-77	87	10	CGRK202603318548	采购入库反审核	2026-03-31 16:34:21.03292
1031	1023	标签/不干胶/奶条/原味	0		procure_in_reverse	-27	325	298	CGRK202603318548	采购入库反审核	2026-03-31 16:34:21.04171
1032	1022	专袋/传统奶豆腐	0		procure_in_reverse	-90	192	102	CGRK202603318109	采购入库反审核	2026-03-31 16:34:22.649362
1033	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-14	1140	1126	CGRK202603314892	采购入库反审核	2026-03-31 16:34:24.149349
1034	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-15	1126	1111	CGRK202603314892	采购入库反审核	2026-03-31 16:34:24.157984
1036	1019	标签/不干胶/冻炒米	0		procure_in_reverse	-500	500	0	CGRK202603318352	采购入库反审核	2026-03-31 16:34:28.834504
1037	1032	专盒/冻炒米	0		procure_in_reverse	-1650	1706	56	CGRK202603318352	采购入库反审核	2026-03-31 16:34:28.842855
1038	1018	礼盒/蓝界	0		procure_in_reverse	-30	56	26	CGRK202603318644	采购入库反审核	2026-03-31 16:34:30.321356
1039	1018	礼盒/蓝界	0		procure_in_reverse	-26	26	0	CGRK202603318644	采购入库反审核	2026-03-31 16:34:30.33026
1040	1017	手提袋	0		procure_in_reverse	-368	368	0	CGRK202603319888	采购入库反审核	2026-03-31 16:34:31.947248
1041	1033	专袋/奶条	0		procure_in_reverse	-80	278	198	CGRK202603319888	采购入库反审核	2026-03-31 16:34:31.956152
1042	1033	专袋/奶条	0		procure_in_reverse	-20	198	178	CGRK202603319888	采购入库反审核	2026-03-31 16:34:31.965746
1043	1033	专袋/奶条	0		procure_in_reverse	-86	178	92	CGRK202603319888	采购入库反审核	2026-03-31 16:34:31.974134
1044	1033	专袋/奶条	0		procure_in_reverse	-5	92	87	CGRK202603319888	采购入库反审核	2026-03-31 16:34:31.983286
1045	1031	专底盒/奶条	0		procure_in_reverse	-17	153	136	CGRK202603319888	采购入库反审核	2026-03-31 16:34:31.992123
1046	1031	专底盒/奶条	0		procure_in_reverse	-24	136	112	CGRK202603319888	采购入库反审核	2026-03-31 16:34:32.001023
1047	1033	专袋/奶条	0		procure_in_reverse	-17	87	70	CGRK202603319881	采购入库反审核	2026-03-31 16:34:33.750014
1048	1033	专袋/奶条	0		procure_in_reverse	-16	70	54	CGRK202603319881	采购入库反审核	2026-03-31 16:34:33.759066
1049	1033	专袋/奶条	0		procure_in_reverse	-47	54	7	CGRK202603319881	采购入库反审核	2026-03-31 16:34:33.767977
1050	1033	专袋/奶条	0		procure_in_reverse	-7	7	0	CGRK202603319881	采购入库反审核	2026-03-31 16:34:33.776942
1051	1031	专底盒/奶条	0		procure_in_reverse	-79	112	33	CGRK202603319881	采购入库反审核	2026-03-31 16:34:33.785772
1052	1031	专底盒/奶条	0		procure_in_reverse	-33	33	0	CGRK202603319881	采购入库反审核	2026-03-31 16:34:33.794734
1053	1030	专外盒/奶果子	0		procure_in_reverse	-6	40	34	CGRK202603319881	采购入库反审核	2026-03-31 16:34:33.803792
1054	1030	专外盒/奶果子	0		procure_in_reverse	-34	34	0	CGRK202603319881	采购入库反审核	2026-03-31 16:34:33.812968
1055	1029	专内盒/奶果子	0		procure_in_reverse	-24	61	37	CGRK202603319881	采购入库反审核	2026-03-31 16:34:33.82207
1056	1029	专内盒/奶果子	0		procure_in_reverse	-37	37	0	CGRK202603319881	采购入库反审核	2026-03-31 16:34:33.831079
1057	1026	专内袋/奶果子	0		procure_in_reverse	-25	107	82	CGRK202603319881	采购入库反审核	2026-03-31 16:34:33.840189
1058	1026	专内袋/奶果子	0		procure_in_reverse	-82	82	0	CGRK202603319881	采购入库反审核	2026-03-31 16:34:33.849116
1059	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-748	1111	363	CGRK202603316489	采购入库反审核	2026-03-31 16:34:35.675252
1060	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-9	363	354	CGRK202603316489	采购入库反审核	2026-03-31 16:34:35.684608
1061	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-260	354	94	CGRK202603316489	采购入库反审核	2026-03-31 16:34:35.693957
1062	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-76	94	18	CGRK202603316489	采购入库反审核	2026-03-31 16:34:35.703205
1063	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-18	18	0	CGRK202603316489	采购入库反审核	2026-03-31 16:34:35.712503
1064	1022	专袋/传统奶豆腐	0		procure_in_reverse	-79	102	23	CGRK202603317845	采购入库反审核	2026-03-31 16:34:37.742839
1065	1022	专袋/传统奶豆腐	0		procure_in_reverse	-23	23	0	CGRK202603317845	采购入库反审核	2026-03-31 16:34:37.752284
1066	1027	真空袋	0		procure_in_reverse	-20	20	0	CGRK202603311463	采购入库反审核	2026-03-31 16:34:39.585633
1067	1016	专瓶/黄油	0		procure_in_reverse	-55	55	0	CGRK202603312514	采购入库反审核	2026-03-31 16:34:42.468979
1068	1032	专盒/冻炒米	0		procure_in_reverse	-36	56	20	CGRK202603313100	采购入库反审核	2026-03-31 16:34:43.932433
1069	1032	专盒/冻炒米	0		procure_in_reverse	-20	20	0	CGRK202603313100	采购入库反审核	2026-03-31 16:34:43.940758
1070	1023	标签/不干胶/奶条/原味	0		procure_in_reverse	-298	298	0	CGRK202603313100	采购入库反审核	2026-03-31 16:34:43.94927
1071	1020	标签/不干胶/奶果子	0		procure_in_reverse	-111	111	0	CGRK202603313100	采购入库反审核	2026-03-31 16:34:43.957813
1072	1028	专标签/黄油	0		procure_in_reverse	-340	840	500	CGRK202603313100	采购入库反审核	2026-03-31 16:34:43.96652
1073	1028	专标签/黄油	0		procure_in_reverse	-500	500	0	CGRK202603313100	采购入库反审核	2026-03-31 16:34:43.975533
1074	1024	标签/不干胶/奶条/甜味	0		procure_in_reverse	-10	10	0	CGRK202603313100	采购入库反审核	2026-03-31 16:34:43.984813
1075	902	乌日莫糖/散装	0		procure_in	5	0	5	CGRK202603314400	采购入库审核	2026-03-31 16:36:25.248102
1076	921	嚼口脆炒米糖/散装	0		procure_in	5	0	5	CGRK202603319747	采购入库审核	2026-03-31 16:36:27.392365
1077	922	酸奶炒米糖/散装	0		procure_in	5	0	5	CGRK202603318354	采购入库审核	2026-03-31 16:36:29.985118
1078	920	手工乌日末液体	0		procure_in	10	0	10	CGRK202603314800	采购入库审核	2026-03-31 16:36:32.252189
1079	981	烤奶皮	0		procure_in	10	0	10	CGRK202603315191	采购入库审核	2026-03-31 16:36:34.103412
1080	857	厚奶皮	0		procure_in	20	0	20	CGRK202603312834	采购入库审核	2026-03-31 16:36:36.679073
1081	804	德吉酸奶/2斤装	0		procure_in	10	0	10	CGRK202603316167	采购入库审核	2026-03-31 16:36:38.76716
1082	805	德吉酸奶/一斤装	0		procure_in	10	0	10	CGRK202603316167	采购入库审核	2026-03-31 16:36:38.773335
1083	806	德吉酸奶/半斤	0		procure_in	10	0	10	CGRK202603316167	采购入库审核	2026-03-31 16:36:38.779782
1085	908	哈斯乌拉牛肉干500g原味	0		procure_in	10	0	10	CGRK202603317521	采购入库审核	2026-03-31 16:36:42.755045
1103	923	炒米/散装/硬口	0		procure_in	30	0	30	CGRK202603313924	采购入库审核	2026-03-31 16:36:50.554001
1105	825	故乡宝酸马奶	0		procure_in	3	0	3	CGRK202603315252	采购入库审核	2026-03-31 16:36:55.562114
1106	826	乌日汗酸奶	0		procure_in	5	0	5	CGRK202603315252	采购入库审核	2026-03-31 16:36:55.568133
1108	901	手工白花炒米/散装	0		procure_in	30	0	30	CGRK202603312902	采购入库审核	2026-03-31 16:36:59.391728
1112	857	厚奶皮	0		procure_in	20	20	40	CGRK202603317175	采购入库审核	2026-03-31 16:37:03.919377
1114	981	烤奶皮	0		procure_in	40	10	50	CGRK202603317026	采购入库审核	2026-03-31 16:37:08.353541
1115	903	盛宇燃奶豆腐/甜味	0		procure_in	3	10	13	CGRK202603317026	采购入库审核	2026-03-31 16:37:08.359566
1116	904	盛宇燃奶豆腐/原味	0		procure_in	4	10	14	CGRK202603317026	采购入库审核	2026-03-31 16:37:08.365091
1117	921	嚼口脆炒米糖/散装	0		procure_in	10	10	20	CGRK202603317026	采购入库审核	2026-03-31 16:37:08.370592
1119	880	阿润月饼/五仁馅	0		procure_in	10	0	10	CGRK202603311146	采购入库审核	2026-03-31 16:37:14.774842
1120	882	阿润月饼/黄油渣馅	0		procure_in	5	0	5	CGRK202603311146	采购入库审核	2026-03-31 16:37:14.780958
1121	831	果条/阿润	0		procure_in	5	0	5	CGRK202603311146	采购入库审核	2026-03-31 16:37:14.786965
1122	916	脆奶条/散装/科尔沁	0		procure_in	10	10	20	CGRK202603314323	采购入库审核	2026-03-31 16:37:16.713953
1126	838	奶粉蒙古国	0		procure_in	3	0	3	CGRK202603318071	采购入库审核	2026-03-31 16:37:20.87862
1127	839	奶皮子粉	0		procure_in	4	0	4	CGRK202603318071	采购入库审核	2026-03-31 16:37:20.884516
1128	840	奶茶粉战粮	0		procure_in	2	0	2	CGRK202603318071	采购入库审核	2026-03-31 16:37:20.889935
1129	841	奶茶粉贡格尔	0		procure_in	2	0	2	CGRK202603318071	采购入库审核	2026-03-31 16:37:20.895919
1130	842	努德勒沁调和茶	0		procure_in	2	0	2	CGRK202603318071	采购入库审核	2026-03-31 16:37:20.901912
1131	843	阿依古丽奶茶专用红茶	0		procure_in	2	0	2	CGRK202603318071	采购入库审核	2026-03-31 16:37:20.907473
1132	844	希日嘎拉奶茶专用茶	0		procure_in	2	0	2	CGRK202603318071	采购入库审核	2026-03-31 16:37:20.912819
1133	837	甜味奶豆腐块儿/大	0		procure_in	5	0	5	CGRK202603318071	采购入库审核	2026-03-31 16:37:20.91879
1134	844	希日嘎拉奶茶专用茶	0		procure_in	2	2	4	CGRK202603318071	采购入库审核	2026-03-31 16:37:20.923964
1136	902	乌日莫糖/散装	0		procure_in	5	5	10	CGRK202603312174	采购入库审核	2026-03-31 16:37:24.70119
1137	922	酸奶炒米糖/散装	0		procure_in	5	5	10	CGRK202603312174	采购入库审核	2026-03-31 16:37:24.706922
1138	921	嚼口脆炒米糖/散装	0		procure_in	5	20	25	CGRK202603312174	采购入库审核	2026-03-31 16:37:24.712422
1139	856	科尔沁/大奶豆腐	0		procure_in	5	5	10	CGRK202603312174	采购入库审核	2026-03-31 16:37:24.717961
1141	855	奶锅巴/扎旗吉十奶制品	0		procure_in	5	0	5	CGRK202603316221	采购入库审核	2026-03-31 16:37:28.041851
1145	851	晴王糖葫芦	0		procure_in	10	0	10	CGRK202603315216	采购入库审核	2026-03-31 16:37:33.277109
1148	856	科尔沁/大奶豆腐	0		procure_in	3	10	13	CGRK202603318248	采购入库审核	2026-03-31 16:37:40.036715
1149	923	炒米/散装/硬口	0		procure_in	1	30	31	CGRK202603318248	采购入库审核	2026-03-31 16:37:40.042718
1152	981	烤奶皮	0		procure_in	10	50	60	CGRK202603314690	采购入库审核	2026-03-31 16:37:47.896769
1153	901	手工白花炒米/散装	0		procure_in	30	30	60	CGRK202603314690	采购入库审核	2026-03-31 16:37:47.902595
1160	860	普通瓜子	0		procure_in	5	10	15	CGRK202603317076	采购入库审核	2026-03-31 16:38:02.443672
1161	861	五香瓜子	0		procure_in	10	0	10	CGRK202603317076	采购入库审核	2026-03-31 16:38:02.450253
1164	991	奶果子/散装	0		procure_in	119	0	119	CGRK202603319311	采购入库审核	2026-03-31 16:38:10.179037
1169	981	烤奶皮	0		procure_in	10	70	80	CGRK202603313499	采购入库审核	2026-03-31 16:38:16.680315
1171	866	酸奶/纯净	0		procure_in	10	0	10	CGRK202603314814	采购入库审核	2026-03-31 16:38:20.416245
1173	920	手工乌日末液体	0		procure_in	10	50	60	CGRK202603312715	采购入库审核	2026-03-31 16:38:23.651921
1174	970	热奶豆腐碗	0		procure_in	36	0	36	CGRK202603312715	采购入库审核	2026-03-31 16:38:23.658182
1175	939	半成品/透明/原味/鲜奶酪	0		procure_in	20	0	20	CGRK202603312715	采购入库审核	2026-03-31 16:38:23.664223
1176	940	半成品/透明/甜味/鲜奶酪	0		procure_in	52	0	52	CGRK202603312715	采购入库审核	2026-03-31 16:38:23.670758
1180	918	黄油/半斤	0		procure_in	5	0	5	CGRK202603316006	采购入库审核	2026-03-31 16:38:27.117038
1181	919	黄油/斤	0		procure_in	5	0	5	CGRK202603316006	采购入库审核	2026-03-31 16:38:27.123776
1182	885	冻炒米/散装	0		procure_in	10	10	20	CGRK202603316006	采购入库审核	2026-03-31 16:38:27.13236
1579	811	蒙古果子/格日勒	0		procure_in_reverse	-12	12	0	CGRK202603316519	采购入库反审核	2026-04-03 07:15:03.517467
1581	856	科尔沁/大奶豆腐	0		procure_in_reverse	-5	13	8	CGRK202603317495	采购入库反审核	2026-04-03 07:15:06.267075
1582	829	奶豆腐/原味/中/科尔沁	0		procure_in_reverse	-5	15	10	CGRK202603317495	采购入库反审核	2026-04-03 07:15:06.276211
1583	903	盛宇燃奶豆腐/甜味	0		procure_in_reverse	-5	17	12	CGRK202603317495	采购入库反审核	2026-04-03 07:15:06.285426
1584	904	盛宇燃奶豆腐/原味	0		procure_in_reverse	-5	18	13	CGRK202603317495	采购入库反审核	2026-04-03 07:15:06.294618
1590	907	风干牛肉500g大片	0		procure_in_reverse	-2	8	6	CGRK202603312507	采购入库反审核	2026-04-03 07:15:09.161645
1591	916	脆奶条/散装/科尔沁	0		procure_in_reverse	-10	80	70	CGRK202603312507	采购入库反审核	2026-04-03 07:15:09.170674
1592	903	盛宇燃奶豆腐/甜味	0		procure_in_reverse	-5	12	7	CGRK202603312507	采购入库反审核	2026-04-03 07:15:09.179891
1593	904	盛宇燃奶豆腐/原味	0		procure_in_reverse	-5	13	8	CGRK202603312507	采购入库反审核	2026-04-03 07:15:09.188695
1594	823	黄油/中瓶	0		procure_in_reverse	-5	5	0	CGRK202603312507	采购入库反审核	2026-04-03 07:15:09.197652
1595	822	黄油/大瓶/科尔沁	0		procure_in_reverse	-5	5	0	CGRK202603312507	采购入库反审核	2026-04-03 07:15:09.207453
1596	829	奶豆腐/原味/中/科尔沁	0		procure_in_reverse	-5	10	5	CGRK202603312507	采购入库反审核	2026-04-03 07:15:09.216151
1597	908	哈斯乌拉牛肉干500g原味	0		procure_in_reverse	-2	9	7	CGRK202603312507	采购入库反审核	2026-04-03 07:15:09.224532
1599	920	手工乌日末液体	0		procure_in_reverse	-10	118	108	CGRK202603314071	采购入库反审核	2026-04-03 07:15:11.941638
1086	856	科尔沁/大奶豆腐	0		procure_in	5	0	5	CGRK202603317495	采购入库审核	2026-03-31 16:36:45.341078
1087	829	奶豆腐/原味/中/科尔沁	0		procure_in	5	0	5	CGRK202603317495	采购入库审核	2026-03-31 16:36:45.347504
1088	903	盛宇燃奶豆腐/甜味	0		procure_in	5	0	5	CGRK202603317495	采购入库审核	2026-03-31 16:36:45.354657
1089	904	盛宇燃奶豆腐/原味	0		procure_in	5	0	5	CGRK202603317495	采购入库审核	2026-03-31 16:36:45.361227
1090	907	风干牛肉500g大片	0		procure_in	5	0	5	CGRK202603313556	采购入库审核	2026-03-31 16:36:47.095669
1091	921	嚼口脆炒米糖/散装	0		procure_in	5	5	10	CGRK202603313556	采购入库审核	2026-03-31 16:36:47.102494
1092	932	炒米海丰	0		procure_in	20	0	20	CGRK202603313556	采购入库审核	2026-03-31 16:36:47.109995
1093	931	炒米粉/aag	0		procure_in	10	0	10	CGRK202603313556	采购入库审核	2026-03-31 16:36:47.116877
1094	823	黄油/中瓶	0		procure_in	10	0	10	CGRK202603313556	采购入库审核	2026-03-31 16:36:47.124059
1095	907	风干牛肉500g大片	0		procure_in	2	5	7	CGRK202603312507	采购入库审核	2026-03-31 16:36:48.631563
1096	916	脆奶条/散装/科尔沁	0		procure_in	10	0	10	CGRK202603312507	采购入库审核	2026-03-31 16:36:48.637827
1097	903	盛宇燃奶豆腐/甜味	0		procure_in	5	5	10	CGRK202603312507	采购入库审核	2026-03-31 16:36:48.644403
1098	904	盛宇燃奶豆腐/原味	0		procure_in	5	5	10	CGRK202603312507	采购入库审核	2026-03-31 16:36:48.6512
1099	823	黄油/中瓶	0		procure_in	5	10	15	CGRK202603312507	采购入库审核	2026-03-31 16:36:48.657796
1100	822	黄油/大瓶/科尔沁	0		procure_in	5	0	5	CGRK202603312507	采购入库审核	2026-03-31 16:36:48.66454
1101	829	奶豆腐/原味/中/科尔沁	0		procure_in	5	5	10	CGRK202603312507	采购入库审核	2026-03-31 16:36:48.671458
1102	908	哈斯乌拉牛肉干500g原味	0		procure_in	2	10	12	CGRK202603312507	采购入库审核	2026-03-31 16:36:48.678466
1104	920	手工乌日末液体	0		procure_in	10	10	20	CGRK202603314071	采购入库审核	2026-03-31 16:36:53.178223
1107	829	奶豆腐/原味/中/科尔沁	0		procure_in	5	10	15	CGRK202603316821	采购入库审核	2026-03-31 16:36:57.638494
1109	830	小米/10斤/小袋	0		procure_in	2	0	2	CGRK202603317338	采购入库审核	2026-03-31 16:37:01.577234
1110	830	小米/10斤/小袋	0		procure_in	5	2	7	CGRK202603317338	采购入库审核	2026-03-31 16:37:01.583695
1111	809	10斤装/小米/绿色纸盒	0		procure_in	8	0	8	CGRK202603317338	采购入库审核	2026-03-31 16:37:01.597582
1113	920	手工乌日末液体	0		procure_in	10	20	30	CGRK202603313280	采购入库审核	2026-03-31 16:37:06.437836
1118	860	普通瓜子	0		procure_in	10	0	10	CGRK202603313622	采购入库审核	2026-03-31 16:37:11.517963
1123	845	乳清饮料	0		procure_in	20	0	20	CGRK202603318569	采购入库审核	2026-03-31 16:37:18.969197
1124	846	酸奶/额吉伊德	0		procure_in	6	0	6	CGRK202603318569	采购入库审核	2026-03-31 16:37:18.975744
1125	847	乌日莫/袋装	0		procure_in	5	0	5	CGRK202603318569	采购入库审核	2026-03-31 16:37:18.982388
1135	836	礼盒/2026	0		procure_in	540	0	540	CGRK202603315542	采购入库审核	2026-03-31 16:37:22.47219
1140	920	手工乌日末液体	0		procure_in	10	30	40	CGRK202603315575	采购入库审核	2026-03-31 16:37:26.236934
1142	852	牛肉干/散/孜然	0		procure_in	5	0	5	CGRK202603311311	采购入库审核	2026-03-31 16:37:30.341075
1143	853	牛肉干/散/香辣	0		procure_in	5	0	5	CGRK202603311311	采购入库审核	2026-03-31 16:37:30.34764
1144	854	牛肉干/散/原味	0		procure_in	5	0	5	CGRK202603311311	采购入库审核	2026-03-31 16:37:30.354004
1146	850	红糖袋/delicious	0		procure_in	100	0	100	CGRK202603313441	采购入库审核	2026-03-31 16:37:35.314103
1147	993	冻炒米专用/塑膜袋	0		procure_in	2000	0	2000	CGRK202603314948	采购入库审核	2026-03-31 16:37:37.5296
1150	872	半成品/黄金纬度牛肉干/那牧尔	0		procure_in	130	0	130	CGRK202603315956	采购入库审核	2026-03-31 16:37:42.823829
1151	857	厚奶皮	0		procure_in	10	40	50	CGRK202603316752	采购入库审核	2026-03-31 16:37:46.351363
1154	879	干肉奶茶	0		procure_in	10	0	10	CGRK202603313952	采购入库审核	2026-03-31 16:37:50.211243
1155	859	糖/阿润	0		procure_in	25	0	25	CGRK202603313952	采购入库审核	2026-03-31 16:37:50.218401
1156	858	糖葫芦	0		procure_in	40	0	40	CGRK202603319491	采购入库审核	2026-03-31 16:37:54.130665
1157	1011	茶包	0		procure_in	10	0	10	CGRK202603319187	采购入库审核	2026-03-31 16:37:55.61804
1158	920	手工乌日末液体	0		procure_in	10	40	50	CGRK202603312455	采购入库审核	2026-03-31 16:37:57.943395
1159	963	小/方形/亚克力盒/	0		procure_in	720	0	720	CGRK202603315735	采购入库审核	2026-03-31 16:37:59.856748
1162	931	炒米粉/aag	0		procure_in	10	10	20	CGRK202603318844	采购入库审核	2026-03-31 16:38:04.75046
1163	997	茶专用/盐包	0		procure_in	10	0	10	CGRK202603314559	采购入库审核	2026-03-31 16:38:07.865815
1165	923	炒米/散装/硬口	0		procure_in	1	31	32	CGRK202603311529	采购入库审核	2026-03-31 16:38:13.416195
1166	981	烤奶皮	0		procure_in	10	60	70	CGRK202603311529	采购入库审核	2026-03-31 16:38:13.422733
1167	908	哈斯乌拉牛肉干500g原味	0		procure_in	3	12	15	CGRK202603311529	采购入库审核	2026-03-31 16:38:13.429188
1168	907	风干牛肉500g大片	0		procure_in	2	7	9	CGRK202603311529	采购入库审核	2026-03-31 16:38:13.435638
1170	1014	散装/甜味奶条	0		procure_in	53	0	53	CGRK202603314896	采购入库审核	2026-03-31 16:38:18.909267
1172	865	牛肉干/和希格图	0		procure_in	20	0	20	CGRK202603313723	采购入库审核	2026-03-31 16:38:22.108278
1177	944	半成品/透明/奶皮千层	0		procure_in	21	0	21	CGRK202603316444	采购入库审核	2026-03-31 16:38:25.49558
1178	885	冻炒米/散装	0		procure_in	10	0	10	CGRK202603316444	采购入库审核	2026-03-31 16:38:25.502567
1179	863	冻炒米/小包散/精品	0		procure_in	100	0	100	CGRK202603316444	采购入库审核	2026-03-31 16:38:25.509629
1183	870	大青砖茶砖	0		procure_in	1	0	1	CGRK202603312281	采购入库审核	2026-03-31 16:38:28.742894
1184	871	小青砖茶砖	0		procure_in	1	0	1	CGRK202603312281	采购入库审核	2026-03-31 16:38:28.749246
1185	869	青砖碎茶	0		procure_in	1	0	1	CGRK202603312281	采购入库审核	2026-03-31 16:38:28.755884
1186	867	5g/青砖袋泡茶	0		procure_in	1	0	1	CGRK202603312281	采购入库审核	2026-03-31 16:38:28.762883
1187	868	16g青砖袋泡茶	0		procure_in	1	0	1	CGRK202603312281	采购入库审核	2026-03-31 16:38:28.769808
1188	878	羊奶粉/1斤	0		procure_in	6	0	6	CGRK202603317078	采购入库审核	2026-03-31 16:38:30.995814
1189	1014	散装/甜味奶条	0		procure_in	19	53	72	CGRK202603318850	采购入库审核	2026-03-31 16:38:33.349482
1190	921	嚼口脆炒米糖/散装	0		procure_in	5	25	30	CGRK202603315913	采购入库审核	2026-03-31 16:38:35.889447
1191	884	实惠/奶豆腐	0		procure_in	9	0	9	CGRK202603313988	采购入库审核	2026-03-31 16:38:38.908215
1192	920	手工乌日末液体	0		procure_in	10	60	70	CGRK202603313988	采购入库审核	2026-03-31 16:38:38.915821
1198	946	半成品/透明/鲜奶皮	0		procure_in	40	0	40	CGRK202603313660	采购入库审核	2026-03-31 16:38:43.164444
1199	945	半成品/透明/奶皮卷	0		procure_in	50	0	50	CGRK202603313660	采购入库审核	2026-03-31 16:38:43.172632
1200	944	半成品/透明/奶皮千层	0		procure_in	20	21	41	CGRK202603313660	采购入库审核	2026-03-31 16:38:43.17912
1201	974	纯净黄油/瓶装好的	0		procure_in	35	0	35	CGRK202603313660	采购入库审核	2026-03-31 16:38:43.18545
1202	899	纯净/黄油/斤	0		procure_in	10	0	10	CGRK202603313660	采购入库审核	2026-03-31 16:38:43.204816
1203	920	手工乌日末液体	0		procure_in	4	70	74	CGRK202603313660	采购入库审核	2026-03-31 16:38:43.211403
1204	968	大/奶皮	0		procure_in	30	0	30	CGRK202603313660	采购入库审核	2026-03-31 16:38:43.218778
1209	884	实惠/奶豆腐	0		procure_in	9	9	18	CGRK202603313621	采购入库审核	2026-03-31 16:38:52.692437
1210	920	手工乌日末液体	0		procure_in	10	74	84	CGRK202603313621	采购入库审核	2026-03-31 16:38:52.698728
1216	946	半成品/透明/鲜奶皮	0		procure_in	40	40	80	CGRK202603312735	采购入库审核	2026-03-31 16:38:59.224178
1217	945	半成品/透明/奶皮卷	0		procure_in	50	50	100	CGRK202603312735	采购入库审核	2026-03-31 16:38:59.230954
1218	944	半成品/透明/奶皮千层	0		procure_in	20	41	61	CGRK202603312735	采购入库审核	2026-03-31 16:38:59.237289
1219	974	纯净黄油/瓶装好的	0		procure_in	35	35	70	CGRK202603312735	采购入库审核	2026-03-31 16:38:59.243708
1220	899	纯净/黄油/斤	0		procure_in	10	10	20	CGRK202603312735	采购入库审核	2026-03-31 16:38:59.25015
1221	920	手工乌日末液体	0		procure_in	4	84	88	CGRK202603312735	采购入库审核	2026-03-31 16:38:59.256548
1222	968	大/奶皮	0		procure_in	30	30	60	CGRK202603312735	采购入库审核	2026-03-31 16:38:59.263088
1223	1024	标签/不干胶/奶条/甜味	0		procure_in	500	500	1000	CGRK202603312169	采购入库审核	2026-03-31 16:39:00.838966
1225	889	奶皮卷/科尔沁	0		procure_in	10	10	20	CGRK202603312674	采购入库审核	2026-03-31 16:39:08.103934
1226	945	半成品/透明/奶皮卷	0		procure_in	25	100	125	CGRK202603312304	采购入库审核	2026-03-31 16:39:11.329678
1227	945	半成品/透明/奶皮卷	0		procure_in	25	125	150	CGRK202603312506	采购入库审核	2026-03-31 16:39:13.275615
1231	885	冻炒米/散装	0		procure_in	13	33	46	CGRK202603316714	采购入库审核	2026-03-31 16:39:22.834384
1232	884	实惠/奶豆腐	0		procure_in	5	23	28	CGRK202603316714	采购入库审核	2026-03-31 16:39:22.840824
1233	924	冻炒米/袋装	0		procure_in	10	10	20	CGRK202603316714	采购入库审核	2026-03-31 16:39:22.847463
1237	916	脆奶条/散装/科尔沁	0		procure_in	20	20	40	CGRK202603315580	采购入库审核	2026-03-31 16:39:28.450191
1238	889	奶皮卷/科尔沁	0		procure_in	7	20	27	CGRK202603315580	采购入库审核	2026-03-31 16:39:28.457569
1239	886	冻炒米/科尔沁	0		procure_in	2	0	2	CGRK202603315580	采购入库审核	2026-03-31 16:39:28.465013
1240	887	羊乳奶粉/奶茶专用	0		procure_in	4	0	4	CGRK202603315580	采购入库审核	2026-03-31 16:39:28.471486
1241	888	河套奶粉	0		procure_in	4	0	4	CGRK202603315580	采购入库审核	2026-03-31 16:39:28.48313
1243	973	精品/奶豆腐块儿/甜味/	0		procure_in	17	17	34	CGRK202603315779	采购入库审核	2026-03-31 16:39:33.650518
1244	986	精品/奶豆腐块儿/原味	0		procure_in	50	50	100	CGRK202603315779	采购入库审核	2026-03-31 16:39:33.689381
1245	916	脆奶条/散装/科尔沁	0		procure_in	20	40	60	CGRK202603314619	采购入库审核	2026-03-31 16:39:36.83254
1246	889	奶皮卷/科尔沁	0		procure_in	7	27	34	CGRK202603314619	采购入库审核	2026-03-31 16:39:36.838944
1247	886	冻炒米/科尔沁	0		procure_in	2	2	4	CGRK202603314619	采购入库审核	2026-03-31 16:39:36.847119
1248	887	羊乳奶粉/奶茶专用	0		procure_in	4	4	8	CGRK202603314619	采购入库审核	2026-03-31 16:39:36.86426
1249	888	河套奶粉	0		procure_in	4	4	8	CGRK202603314619	采购入库审核	2026-03-31 16:39:36.872876
1251	1015	散装/原味奶条	0		procure_in	12	0	12	CGRK202603311843	采购入库审核	2026-03-31 16:39:42.597918
1253	1015	散装/原味奶条	0		procure_in	12	12	24	CGRK202603317384	采购入库审核	2026-03-31 16:39:47.07121
1254	902	乌日莫糖/散装	0		procure_in	5	10	15	CGRK202603313871	采购入库审核	2026-03-31 16:39:48.606197
1255	921	嚼口脆炒米糖/散装	0		procure_in	5	30	35	CGRK202603313871	采购入库审核	2026-03-31 16:39:48.613359
1256	922	酸奶炒米糖/散装	0		procure_in	5	10	15	CGRK202603313871	采购入库审核	2026-03-31 16:39:48.619928
1264	902	乌日莫糖/散装	0		procure_in	5	15	20	CGRK202603313985	采购入库审核	2026-03-31 16:39:52.95855
1265	921	嚼口脆炒米糖/散装	0		procure_in	5	35	40	CGRK202603313985	采购入库审核	2026-03-31 16:39:52.964784
1266	922	酸奶炒米糖/散装	0		procure_in	5	15	20	CGRK202603313985	采购入库审核	2026-03-31 16:39:52.97143
1274	920	手工乌日末液体	0		procure_in	10	88	98	CGRK202603315838	采购入库审核	2026-03-31 16:39:58.598924
1275	917	机器乌日末液体	0		procure_in	4	0	4	CGRK202603315838	采购入库审核	2026-03-31 16:39:58.6058
1278	899	纯净/黄油/斤	0		procure_in	6	20	26	CGRK202603316842	采购入库审核	2026-03-31 16:40:02.80388
1279	945	半成品/透明/奶皮卷	0		procure_in	10	150	160	CGRK202603316842	采购入库审核	2026-03-31 16:40:02.810181
1281	899	纯净/黄油/斤	0		procure_in	6	26	32	CGRK202603313127	采购入库审核	2026-03-31 16:40:10.75758
1282	945	半成品/透明/奶皮卷	0		procure_in	10	160	170	CGRK202603313127	采购入库审核	2026-03-31 16:40:10.764186
1284	901	手工白花炒米/散装	0		procure_in	30	60	90	CGRK202603314294	采购入库审核	2026-03-31 16:40:14.610978
1285	902	乌日莫糖/散装	0		procure_in	5	20	25	CGRK202603314294	采购入库审核	2026-03-31 16:40:14.618809
1286	915	黄油渣/盒	0		procure_in	4	0	4	CGRK202603314294	采购入库审核	2026-03-31 16:40:14.625304
1287	981	烤奶皮	0		procure_in	10	80	90	CGRK202603314294	采购入库审核	2026-03-31 16:40:14.631781
1289	1013	冻炒米/给组装半成品/那牧尔	0		procure_in	100	200	300	CGRK202603318659	采购入库审核	2026-03-31 16:40:19.137962
1297	929	白砂糖	0		procure_in	6	0	6	CGRK202603314799	采购入库审核	2026-03-31 16:40:25.936319
1298	901	手工白花炒米/散装	0		procure_in	30	90	120	CGRK202603316269	采购入库审核	2026-03-31 16:40:27.432302
1299	902	乌日莫糖/散装	0		procure_in	5	25	30	CGRK202603316269	采购入库审核	2026-03-31 16:40:27.439475
1300	915	黄油渣/盒	0		procure_in	4	4	8	CGRK202603316269	采购入库审核	2026-03-31 16:40:27.446253
1193	880	阿润月饼/五仁馅	0		procure_in	4	10	14	CGRK202603313167	采购入库审核	2026-03-31 16:38:40.845012
1194	879	干肉奶茶	0		procure_in	4	10	14	CGRK202603313167	采购入库审核	2026-03-31 16:38:40.851265
1195	881	阿润月饼/奶皮子馅	0		procure_in	4	0	4	CGRK202603313167	采购入库审核	2026-03-31 16:38:40.857471
1196	882	阿润月饼/黄油渣馅	0		procure_in	4	5	9	CGRK202603313167	采购入库审核	2026-03-31 16:38:40.863599
1197	883	阿润月饼/奶豆腐馅	0		procure_in	4	0	4	CGRK202603313167	采购入库审核	2026-03-31 16:38:40.870024
1205	1024	标签/不干胶/奶条/甜味	0		procure_in	500	0	500	CGRK202603316909	采购入库审核	2026-03-31 16:38:45.55721
1206	898	透专标签/奶皮千层	0		procure_in	500	0	500	CGRK202603313318	采购入库审核	2026-03-31 16:38:48.210429
1207	983	甜味/标签/不干胶/传统奶豆腐	0		procure_in	500	0	500	CGRK202603312826	采购入库审核	2026-03-31 16:38:50.880536
1208	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in	500	0	500	CGRK202603312826	采购入库审核	2026-03-31 16:38:50.886189
1211	880	阿润月饼/五仁馅	0		procure_in	4	14	18	CGRK202603319433	采购入库审核	2026-03-31 16:38:55.251626
1212	879	干肉奶茶	0		procure_in	4	14	18	CGRK202603319433	采购入库审核	2026-03-31 16:38:55.257967
1213	881	阿润月饼/奶皮子馅	0		procure_in	4	4	8	CGRK202603319433	采购入库审核	2026-03-31 16:38:55.266756
1214	882	阿润月饼/黄油渣馅	0		procure_in	4	9	13	CGRK202603319433	采购入库审核	2026-03-31 16:38:55.290588
1215	883	阿润月饼/奶豆腐馅	0		procure_in	4	4	8	CGRK202603319433	采购入库审核	2026-03-31 16:38:55.301158
1224	889	奶皮卷/科尔沁	0		procure_in	10	0	10	CGRK202603315278	采购入库审核	2026-03-31 16:39:06.038378
1228	885	冻炒米/散装	0		procure_in	13	20	33	CGRK202603316789	采购入库审核	2026-03-31 16:39:15.772397
1229	884	实惠/奶豆腐	0		procure_in	5	18	23	CGRK202603316789	采购入库审核	2026-03-31 16:39:15.779045
1230	924	冻炒米/袋装	0		procure_in	10	0	10	CGRK202603316789	采购入库审核	2026-03-31 16:39:15.787689
1234	890	红枣	0		procure_in	12	0	12	CGRK202603313188	采购入库审核	2026-03-31 16:39:24.559511
1235	973	精品/奶豆腐块儿/甜味/	0		procure_in	17	0	17	CGRK202603314149	采购入库审核	2026-03-31 16:39:26.903994
1236	986	精品/奶豆腐块儿/原味	0		procure_in	50	0	50	CGRK202603314149	采购入库审核	2026-03-31 16:39:26.909901
1242	890	红枣	0		procure_in	12	12	24	CGRK202603319636	采购入库审核	2026-03-31 16:39:31.005922
1250	1014	散装/甜味奶条	0		procure_in	23	72	95	CGRK202603314424	采购入库审核	2026-03-31 16:39:40.734811
1252	1014	散装/甜味奶条	0		procure_in	23	95	118	CGRK202603314244	采购入库审核	2026-03-31 16:39:44.513664
1257	891	芝士奶豆腐月饼	0		procure_in	10	0	10	CGRK202603316826	采购入库审核	2026-03-31 16:39:50.478688
1258	893	奶豆腐月饼	0		procure_in	10	0	10	CGRK202603316826	采购入库审核	2026-03-31 16:39:50.484467
1259	892	那牧尔酸奶	0		procure_in	10	0	10	CGRK202603316826	采购入库审核	2026-03-31 16:39:50.490798
1260	895	黄油渣月饼	0		procure_in	10	0	10	CGRK202603316826	采购入库审核	2026-03-31 16:39:50.496186
1261	896	奶皮月饼	0		procure_in	10	0	10	CGRK202603316826	采购入库审核	2026-03-31 16:39:50.50249
1262	897	早餐包/那牧尔	0		procure_in	10	0	10	CGRK202603316826	采购入库审核	2026-03-31 16:39:50.509083
1263	894	酸奶月饼	0		procure_in	10	0	10	CGRK202603316826	采购入库审核	2026-03-31 16:39:50.514496
1267	891	芝士奶豆腐月饼	0		procure_in	10	10	20	CGRK202603315807	采购入库审核	2026-03-31 16:39:55.403172
1268	893	奶豆腐月饼	0		procure_in	10	10	20	CGRK202603315807	采购入库审核	2026-03-31 16:39:55.409266
1269	892	那牧尔酸奶	0		procure_in	10	10	20	CGRK202603315807	采购入库审核	2026-03-31 16:39:55.415519
1270	895	黄油渣月饼	0		procure_in	10	10	20	CGRK202603315807	采购入库审核	2026-03-31 16:39:55.421934
1271	896	奶皮月饼	0		procure_in	10	10	20	CGRK202603315807	采购入库审核	2026-03-31 16:39:55.427693
1272	897	早餐包/那牧尔	0		procure_in	10	10	20	CGRK202603315807	采购入库审核	2026-03-31 16:39:55.433937
1273	894	酸奶月饼	0		procure_in	10	10	20	CGRK202603315807	采购入库审核	2026-03-31 16:39:55.439848
1276	920	手工乌日末液体	0		procure_in	10	98	108	CGRK202603311412	采购入库审核	2026-03-31 16:40:01.297816
1277	917	机器乌日末液体	0		procure_in	4	4	8	CGRK202603311412	采购入库审核	2026-03-31 16:40:01.303661
1280	1013	冻炒米/给组装半成品/那牧尔	0		procure_in	100	0	100	CGRK202603317749	采购入库审核	2026-03-31 16:40:06.464678
1283	1013	冻炒米/给组装半成品/那牧尔	0		procure_in	100	100	200	CGRK202603315380	采购入库审核	2026-03-31 16:40:12.939345
1288	1015	散装/原味奶条	0		procure_in	31	24	55	CGRK202603311418	采购入库审核	2026-03-31 16:40:17.210702
1290	900	透专标签/脆香奶条/微甜	0		procure_in	500	0	500	CGRK202603319871	采购入库审核	2026-03-31 16:40:21.318171
1291	950	透专标签/奶皮卷	0		procure_in	500	0	500	CGRK202603319871	采购入库审核	2026-03-31 16:40:21.324209
1292	951	透专标签/冻炒米	0		procure_in	500	0	500	CGRK202603319871	采购入库审核	2026-03-31 16:40:21.329975
1293	952	透专标签/奶酪/原味	0		procure_in	500	0	500	CGRK202603319871	采购入库审核	2026-03-31 16:40:21.336362
1294	953	透专标签/奶酪/甜味	0		procure_in	500	0	500	CGRK202603319871	采购入库审核	2026-03-31 16:40:21.342373
1295	956	透专标签/鲜奶皮	0		procure_in	500	0	500	CGRK202603319871	采购入库审核	2026-03-31 16:40:21.34816
1296	1010	奶油球	0		procure_in	20	0	20	CGRK202603316302	采购入库审核	2026-03-31 16:40:24.435513
1302	1015	散装/原味奶条	0		procure_in	31	55	86	CGRK202603313522	采购入库审核	2026-03-31 16:40:29.723366
1304	900	透专标签/脆香奶条/微甜	0		procure_in	500	500	1000	CGRK202603315560	采购入库审核	2026-03-31 16:40:32.816179
1305	950	透专标签/奶皮卷	0		procure_in	500	500	1000	CGRK202603315560	采购入库审核	2026-03-31 16:40:32.823383
1306	951	透专标签/冻炒米	0		procure_in	500	500	1000	CGRK202603315560	采购入库审核	2026-03-31 16:40:32.829573
1307	952	透专标签/奶酪/原味	0		procure_in	500	500	1000	CGRK202603315560	采购入库审核	2026-03-31 16:40:32.835393
1308	953	透专标签/奶酪/甜味	0		procure_in	500	500	1000	CGRK202603315560	采购入库审核	2026-03-31 16:40:32.841861
1309	956	透专标签/鲜奶皮	0		procure_in	500	500	1000	CGRK202603315560	采购入库审核	2026-03-31 16:40:32.848209
1312	923	炒米/散装/硬口	0		procure_in	1	32	33	CGRK202603311073	采购入库审核	2026-03-31 16:40:38.015507
1315	907	风干牛肉500g大片	0		procure_in	2	9	11	CGRK202603316985	采购入库审核	2026-03-31 16:40:41.03679
1316	908	哈斯乌拉牛肉干500g原味	0		procure_in	2	15	17	CGRK202603316985	采购入库审核	2026-03-31 16:40:41.042403
1317	909	蓝旗绿乳糖惠虹糖	0		procure_in	2	0	2	CGRK202603316985	采购入库审核	2026-03-31 16:40:41.048284
1301	981	烤奶皮	0		procure_in	10	90	100	CGRK202603316269	采购入库审核	2026-03-31 16:40:27.453061
1303	1013	冻炒米/给组装半成品/那牧尔	0		procure_in	100	300	400	CGRK202603314722	采购入库审核	2026-03-31 16:40:31.296645
1310	1010	奶油球	0		procure_in	20	20	40	CGRK202603317292	采购入库审核	2026-03-31 16:40:34.451407
1311	929	白砂糖	0		procure_in	6	6	12	CGRK202603314637	采购入库审核	2026-03-31 16:40:36.506903
1313	922	酸奶炒米糖/散装	0		procure_in	1	20	21	CGRK202603315061	采购入库审核	2026-03-31 16:40:39.50988
1314	921	嚼口脆炒米糖/散装	0		procure_in	1	40	41	CGRK202603315061	采购入库审核	2026-03-31 16:40:39.517316
1331	923	炒米/散装/硬口	0		procure_in	1	33	34	CGRK202603317247	采购入库审核	2026-03-31 16:40:42.694655
1334	907	风干牛肉500g大片	0		procure_in	2	11	13	CGRK202603312692	采购入库审核	2026-03-31 16:40:45.856749
1335	908	哈斯乌拉牛肉干500g原味	0		procure_in	2	17	19	CGRK202603312692	采购入库审核	2026-03-31 16:40:45.864344
1336	909	蓝旗绿乳糖惠虹糖	0		procure_in	2	2	4	CGRK202603312692	采购入库审核	2026-03-31 16:40:45.87215
1337	910	蓝旗绿乳糖奶香酥	0		procure_in	2	2	4	CGRK202603312692	采购入库审核	2026-03-31 16:40:45.879144
1338	911	蓝旗绿乳糖果仁酥	0		procure_in	2	2	4	CGRK202603312692	采购入库审核	2026-03-31 16:40:45.885855
1339	912	蓝旗绿乳糖水果	0		procure_in	2	2	4	CGRK202603312692	采购入库审核	2026-03-31 16:40:45.89247
1340	913	蓝旗绿乳糖黄油球	0		procure_in	2	2	4	CGRK202603312692	采购入库审核	2026-03-31 16:40:45.899256
1341	914	蓝旗绿乳糖炼乳	0		procure_in	2	2	4	CGRK202603312692	采购入库审核	2026-03-31 16:40:45.905829
1342	921	嚼口脆炒米糖/散装	0		procure_in	1	43	44	CGRK202603312692	采购入库审核	2026-03-31 16:40:45.91316
1343	922	酸奶炒米糖/散装	0		procure_in	1	23	24	CGRK202603312692	采购入库审核	2026-03-31 16:40:45.919898
1344	915	黄油渣/盒	0		procure_in	4	12	16	CGRK202603312692	采购入库审核	2026-03-31 16:40:45.927499
1345	916	脆奶条/散装/科尔沁	0		procure_in	10	70	80	CGRK202603312692	采购入库审核	2026-03-31 16:40:45.934601
1346	905	真空奶豆腐砖/甜味	0		procure_in	2	2	4	CGRK202603312692	采购入库审核	2026-03-31 16:40:45.941359
1347	906	真空奶豆腐砖/原味	0		procure_in	2	2	4	CGRK202603312692	采购入库审核	2026-03-31 16:40:45.94824
1348	903	盛宇燃奶豆腐/甜味	0		procure_in	2	15	17	CGRK202603312692	采购入库审核	2026-03-31 16:40:45.954795
1349	904	盛宇燃奶豆腐/原味	0		procure_in	2	16	18	CGRK202603312692	采购入库审核	2026-03-31 16:40:45.961359
1350	924	冻炒米/袋装	0		procure_in	5	20	25	CGRK202603312165	采购入库审核	2026-03-31 16:40:47.576645
1351	917	机器乌日末液体	0		procure_in	2	8	10	CGRK202603312165	采购入库审核	2026-03-31 16:40:47.583345
1352	920	手工乌日末液体	0		procure_in	10	108	118	CGRK202603312165	采购入库审核	2026-03-31 16:40:47.590283
1353	918	黄油/半斤	0		procure_in	2	5	7	CGRK202603312165	采购入库审核	2026-03-31 16:40:47.596971
1354	919	黄油/斤	0		procure_in	4	5	9	CGRK202603312165	采购入库审核	2026-03-31 16:40:47.603019
1356	924	冻炒米/袋装	0		procure_in	5	25	30	CGRK202603317772	采购入库审核	2026-03-31 16:40:50.848956
1357	917	机器乌日末液体	0		procure_in	2	10	12	CGRK202603317772	采购入库审核	2026-03-31 16:40:50.855625
1358	920	手工乌日末液体	0		procure_in	10	118	128	CGRK202603317772	采购入库审核	2026-03-31 16:40:50.862858
1359	918	黄油/半斤	0		procure_in	2	7	9	CGRK202603317772	采购入库审核	2026-03-31 16:40:50.869557
1360	919	黄油/斤	0		procure_in	4	9	13	CGRK202603317772	采购入库审核	2026-03-31 16:40:50.876243
1363	1013	冻炒米/给组装半成品/那牧尔	0		procure_in	40	400	440	CGRK202603318027	采购入库审核	2026-03-31 16:40:53.908914
1364	930	加沙奶豆腐	0		procure_in	5	0	5	CGRK202603318023	采购入库审核	2026-03-31 16:40:55.372395
1365	931	炒米粉/aag	0		procure_in	10	20	30	CGRK202603318023	采购入库审核	2026-03-31 16:40:55.378593
1366	932	炒米海丰	0		procure_in	10	20	30	CGRK202603318023	采购入库审核	2026-03-31 16:40:55.384773
1367	929	白砂糖	0		procure_in	2	12	14	CGRK202603317210	采购入库审核	2026-03-31 16:40:57.315437
1368	1002	封口机/真空	0		procure_in	1	0	1	CGRK202603317210	采购入库审核	2026-03-31 16:40:57.321935
1369	928	塑料购物袋	0		procure_in	300	0	300	CGRK202603317210	采购入库审核	2026-03-31 16:40:57.328546
1370	926	大奶豆腐砖/1.2斤	0		procure_in	19	0	19	CGRK202603313193	采购入库审核	2026-03-31 16:40:58.831853
1371	927	小奶豆腐砖/1斤	0		procure_in	20	0	20	CGRK202603313193	采购入库审核	2026-03-31 16:40:58.838789
1372	925	小/无印花/奶豆腐砖/1斤	0		procure_in	20	0	20	CGRK202603313193	采购入库审核	2026-03-31 16:40:58.845379
1373	946	半成品/透明/鲜奶皮	0		procure_in	29	80	109	CGRK202603313193	采购入库审核	2026-03-31 16:40:58.851555
1374	945	半成品/透明/奶皮卷	0		procure_in	6	170	176	CGRK202603313193	采购入库审核	2026-03-31 16:40:58.857725
1375	939	半成品/透明/原味/鲜奶酪	0		procure_in	40	20	60	CGRK202603313193	采购入库审核	2026-03-31 16:40:58.864345
1376	940	半成品/透明/甜味/鲜奶酪	0		procure_in	40	52	92	CGRK202603313193	采购入库审核	2026-03-31 16:40:58.87047
1379	1013	冻炒米/给组装半成品/那牧尔	0		procure_in	40	440	480	CGRK202603316103	采购入库审核	2026-03-31 16:41:01.968952
1383	929	白砂糖	0		procure_in	2	14	16	CGRK202603314923	采购入库审核	2026-03-31 16:41:05.305294
1384	1002	封口机/真空	0		procure_in	1	1	2	CGRK202603314923	采购入库审核	2026-03-31 16:41:05.31182
1385	928	塑料购物袋	0		procure_in	300	300	600	CGRK202603314923	采购入库审核	2026-03-31 16:41:05.318097
1393	981	烤奶皮	0		procure_in	7	100	107	CGRK202603312723	采购入库审核	2026-03-31 16:41:10.16843
1397	963	小/方形/亚克力盒/	0		procure_in	240	720	960	CGRK202603316560	采购入库审核	2026-03-31 16:41:14.21043
1398	962	中/方形/亚克力盒/	0		procure_in	258	0	258	CGRK202603316560	采购入库审核	2026-03-31 16:41:14.216625
1399	960	三角/奶皮千层盒	0		procure_in	200	0	200	CGRK202603316560	采购入库审核	2026-03-31 16:41:14.222769
1400	961	扁盒/亚克力/带内托	0		procure_in	300	0	300	CGRK202603316560	采购入库审核	2026-03-31 16:41:14.229541
1401	959	大/牛薄脆盒/亚克力	0		procure_in	246	0	246	CGRK202603316560	采购入库审核	2026-03-31 16:41:14.23606
1402	958	小/长方/亚克力/乳清奶条盒	0		procure_in	183	0	183	CGRK202603316560	采购入库审核	2026-03-31 16:41:14.241906
1403	957	大/长方/亚克力/待用	0		procure_in	180	0	180	CGRK202603316560	采购入库审核	2026-03-31 16:41:14.248443
1413	981	烤奶皮	0		procure_in	7	107	114	CGRK202603317710	采购入库审核	2026-03-31 16:41:17.383197
1318	910	蓝旗绿乳糖奶香酥	0		procure_in	2	0	2	CGRK202603316985	采购入库审核	2026-03-31 16:40:41.053297
1319	911	蓝旗绿乳糖果仁酥	0		procure_in	2	0	2	CGRK202603316985	采购入库审核	2026-03-31 16:40:41.059586
1320	912	蓝旗绿乳糖水果	0		procure_in	2	0	2	CGRK202603316985	采购入库审核	2026-03-31 16:40:41.065131
1321	913	蓝旗绿乳糖黄油球	0		procure_in	2	0	2	CGRK202603316985	采购入库审核	2026-03-31 16:40:41.071119
1322	914	蓝旗绿乳糖炼乳	0		procure_in	2	0	2	CGRK202603316985	采购入库审核	2026-03-31 16:40:41.077243
1323	921	嚼口脆炒米糖/散装	0		procure_in	1	41	42	CGRK202603316985	采购入库审核	2026-03-31 16:40:41.082623
1324	922	酸奶炒米糖/散装	0		procure_in	1	21	22	CGRK202603316985	采购入库审核	2026-03-31 16:40:41.088299
1325	915	黄油渣/盒	0		procure_in	4	8	12	CGRK202603316985	采购入库审核	2026-03-31 16:40:41.093786
1326	916	脆奶条/散装/科尔沁	0		procure_in	10	60	70	CGRK202603316985	采购入库审核	2026-03-31 16:40:41.099534
1327	905	真空奶豆腐砖/甜味	0		procure_in	2	0	2	CGRK202603316985	采购入库审核	2026-03-31 16:40:41.105869
1328	906	真空奶豆腐砖/原味	0		procure_in	2	0	2	CGRK202603316985	采购入库审核	2026-03-31 16:40:41.111744
1329	903	盛宇燃奶豆腐/甜味	0		procure_in	2	13	15	CGRK202603316985	采购入库审核	2026-03-31 16:40:41.117336
1330	904	盛宇燃奶豆腐/原味	0		procure_in	2	14	16	CGRK202603316985	采购入库审核	2026-03-31 16:40:41.122657
1332	922	酸奶炒米糖/散装	0		procure_in	1	22	23	CGRK202603318149	采购入库审核	2026-03-31 16:40:44.33005
1333	921	嚼口脆炒米糖/散装	0		procure_in	1	42	43	CGRK202603318149	采购入库审核	2026-03-31 16:40:44.335996
1355	873	专袋/牛肉干包装	0		procure_in	3000	0	3000	CGRK202603317882	采购入库审核	2026-03-31 16:40:49.168735
1361	949	专袋/乌日莫/炒米	0		procure_in	100	0	100	CGRK202603315624	采购入库审核	2026-03-31 16:40:52.328444
1362	948	专袋/乌日莫	0		procure_in	100	0	100	CGRK202603315624	采购入库审核	2026-03-31 16:40:52.334477
1377	949	专袋/乌日莫/炒米	0		procure_in	100	100	200	CGRK202603311851	采购入库审核	2026-03-31 16:41:00.482586
1378	948	专袋/乌日莫	0		procure_in	100	100	200	CGRK202603311851	采购入库审核	2026-03-31 16:41:00.488996
1380	930	加沙奶豆腐	0		procure_in	5	5	10	CGRK202603313573	采购入库审核	2026-03-31 16:41:03.478436
1381	931	炒米粉/aag	0		procure_in	10	30	40	CGRK202603313573	采购入库审核	2026-03-31 16:41:03.484308
1382	932	炒米海丰	0		procure_in	10	30	40	CGRK202603313573	采购入库审核	2026-03-31 16:41:03.490107
1386	926	大奶豆腐砖/1.2斤	0		procure_in	19	19	38	CGRK202603316519	采购入库审核	2026-03-31 16:41:06.930083
1387	927	小奶豆腐砖/1斤	0		procure_in	20	20	40	CGRK202603316519	采购入库审核	2026-03-31 16:41:06.935754
1388	925	小/无印花/奶豆腐砖/1斤	0		procure_in	20	20	40	CGRK202603316519	采购入库审核	2026-03-31 16:41:06.941224
1389	946	半成品/透明/鲜奶皮	0		procure_in	29	109	138	CGRK202603316519	采购入库审核	2026-03-31 16:41:06.948033
1390	945	半成品/透明/奶皮卷	0		procure_in	6	176	182	CGRK202603316519	采购入库审核	2026-03-31 16:41:06.954116
1391	939	半成品/透明/原味/鲜奶酪	0		procure_in	40	60	100	CGRK202603316519	采购入库审核	2026-03-31 16:41:06.960353
1392	940	半成品/透明/甜味/鲜奶酪	0		procure_in	40	92	132	CGRK202603316519	采购入库审核	2026-03-31 16:41:06.966795
1394	973	精品/奶豆腐块儿/甜味/	0		procure_in	20	34	54	CGRK202603316782	采购入库审核	2026-03-31 16:41:12.364604
1395	986	精品/奶豆腐块儿/原味	0		procure_in	20	100	120	CGRK202603316782	采购入库审核	2026-03-31 16:41:12.369904
1396	974	纯净黄油/瓶装好的	0		procure_in	32	70	102	CGRK202603316782	采购入库审核	2026-03-31 16:41:12.375502
1404	979	新茶包/纸	0		procure_in	20000	0	20000	CGRK202603312482	采购入库审核	2026-03-31 16:41:15.787157
1405	1020	标签/不干胶/奶果子	0		procure_in	500	0	500	CGRK202603312482	采购入库审核	2026-03-31 16:41:15.793468
1406	950	透专标签/奶皮卷	0		procure_in	500	1000	1500	CGRK202603312482	采购入库审核	2026-03-31 16:41:15.799945
1407	951	透专标签/冻炒米	0		procure_in	500	1000	1500	CGRK202603312482	采购入库审核	2026-03-31 16:41:15.805447
1408	952	透专标签/奶酪/原味	0		procure_in	500	1000	1500	CGRK202603312482	采购入库审核	2026-03-31 16:41:15.811294
1409	953	透专标签/奶酪/甜味	0		procure_in	500	1000	1500	CGRK202603312482	采购入库审核	2026-03-31 16:41:15.817214
1410	954	透专标签/乳清奶条/甜味	0		procure_in	500	0	500	CGRK202603312482	采购入库审核	2026-03-31 16:41:15.822474
1411	955	透专标签/乳清奶条/原味	0		procure_in	500	0	500	CGRK202603312482	采购入库审核	2026-03-31 16:41:15.828013
1412	956	透专标签/鲜奶皮	0		procure_in	500	1000	1500	CGRK202603312482	采购入库审核	2026-03-31 16:41:15.833965
1414	973	精品/奶豆腐块儿/甜味/	0		procure_in	20	54	74	CGRK202603318332	采购入库审核	2026-03-31 16:41:18.880845
1415	986	精品/奶豆腐块儿/原味	0		procure_in	20	120	140	CGRK202603318332	采购入库审核	2026-03-31 16:41:18.886684
1416	974	纯净黄油/瓶装好的	0		procure_in	32	102	134	CGRK202603318332	采购入库审核	2026-03-31 16:41:18.892227
1424	979	新茶包/纸	0		procure_in	20000	20000	40000	CGRK202603319374	采购入库审核	2026-03-31 16:41:22.368236
1425	1020	标签/不干胶/奶果子	0		procure_in	500	500	1000	CGRK202603319374	采购入库审核	2026-03-31 16:41:22.382094
1426	950	透专标签/奶皮卷	0		procure_in	500	1500	2000	CGRK202603319374	采购入库审核	2026-03-31 16:41:22.387857
1427	951	透专标签/冻炒米	0		procure_in	500	1500	2000	CGRK202603319374	采购入库审核	2026-03-31 16:41:22.393188
1428	952	透专标签/奶酪/原味	0		procure_in	500	1500	2000	CGRK202603319374	采购入库审核	2026-03-31 16:41:22.398416
1429	953	透专标签/奶酪/甜味	0		procure_in	500	1500	2000	CGRK202603319374	采购入库审核	2026-03-31 16:41:22.403625
1430	954	透专标签/乳清奶条/甜味	0		procure_in	500	500	1000	CGRK202603319374	采购入库审核	2026-03-31 16:41:22.40883
1431	955	透专标签/乳清奶条/原味	0		procure_in	500	500	1000	CGRK202603319374	采购入库审核	2026-03-31 16:41:22.414019
1432	956	透专标签/鲜奶皮	0		procure_in	500	1500	2000	CGRK202603319374	采购入库审核	2026-03-31 16:41:22.419439
1449	982	塑料手提袋	0		procure_in	5000	0	5000	CGRK202603316912	采购入库审核	2026-03-31 16:41:27.169478
1602	829	奶豆腐/原味/中/科尔沁	0		procure_in_reverse	-5	5	0	CGRK202603316821	采购入库反审核	2026-04-03 07:15:15.042634
1604	830	小米/10斤/小袋	0		procure_in_reverse	-2	7	5	CGRK202603317338	采购入库反审核	2026-04-03 07:15:17.799092
1605	830	小米/10斤/小袋	0		procure_in_reverse	-5	5	0	CGRK202603317338	采购入库反审核	2026-04-03 07:15:17.808275
1606	809	10斤装/小米/绿色纸盒	0		procure_in_reverse	-8	8	0	CGRK202603317338	采购入库反审核	2026-04-03 07:15:17.816921
1417	963	小/方形/亚克力盒/	0		procure_in	240	960	1200	CGRK202603318706	采购入库审核	2026-03-31 16:41:20.520564
1418	962	中/方形/亚克力盒/	0		procure_in	258	258	516	CGRK202603318706	采购入库审核	2026-03-31 16:41:20.526574
1419	960	三角/奶皮千层盒	0		procure_in	200	200	400	CGRK202603318706	采购入库审核	2026-03-31 16:41:20.532763
1420	961	扁盒/亚克力/带内托	0		procure_in	300	300	600	CGRK202603318706	采购入库审核	2026-03-31 16:41:20.538856
1421	959	大/牛薄脆盒/亚克力	0		procure_in	246	246	492	CGRK202603318706	采购入库审核	2026-03-31 16:41:20.544736
1422	958	小/长方/亚克力/乳清奶条盒	0		procure_in	183	183	366	CGRK202603318706	采购入库审核	2026-03-31 16:41:20.551464
1423	957	大/长方/亚克力/待用	0		procure_in	180	180	360	CGRK202603318706	采购入库审核	2026-03-31 16:41:20.557657
1433	972	原味/散称/奶豆腐块儿	0		procure_in	10	0	10	CGRK202603318436	采购入库审核	2026-03-31 16:41:23.920546
1434	971	甜味/散称/奶豆腐块儿	0		procure_in	10	0	10	CGRK202603318436	采购入库审核	2026-03-31 16:41:23.927214
1435	965	半成品/透明/冻炒米	0		procure_in	38	0	38	CGRK202603318436	采购入库审核	2026-03-31 16:41:23.933788
1436	970	热奶豆腐碗	0		procure_in	50	36	86	CGRK202603318436	采购入库审核	2026-03-31 16:41:23.940301
1437	968	大/奶皮	0		procure_in	30	60	90	CGRK202603318436	采购入库审核	2026-03-31 16:41:23.946425
1438	969	小/奶皮	0		procure_in	30	0	30	CGRK202603318436	采购入库审核	2026-03-31 16:41:23.953218
1439	967	查嘎/乳清	0		procure_in	5	0	5	CGRK202603318436	采购入库审核	2026-03-31 16:41:23.959617
1440	966	查嘎粉/小包装袋	0		procure_in	30	0	30	CGRK202603318436	采购入库审核	2026-03-31 16:41:23.965942
1441	972	原味/散称/奶豆腐块儿	0		procure_in	10	10	20	CGRK202603317488	采购入库审核	2026-03-31 16:41:25.466506
1442	971	甜味/散称/奶豆腐块儿	0		procure_in	10	10	20	CGRK202603317488	采购入库审核	2026-03-31 16:41:25.473261
1443	965	半成品/透明/冻炒米	0		procure_in	38	38	76	CGRK202603317488	采购入库审核	2026-03-31 16:41:25.479449
1444	970	热奶豆腐碗	0		procure_in	50	86	136	CGRK202603317488	采购入库审核	2026-03-31 16:41:25.485721
1445	968	大/奶皮	0		procure_in	30	90	120	CGRK202603317488	采购入库审核	2026-03-31 16:41:25.492274
1446	969	小/奶皮	0		procure_in	30	30	60	CGRK202603317488	采购入库审核	2026-03-31 16:41:25.499186
1447	967	查嘎/乳清	0		procure_in	5	5	10	CGRK202603317488	采购入库审核	2026-03-31 16:41:25.505291
1448	966	查嘎粉/小包装袋	0		procure_in	30	30	60	CGRK202603317488	采购入库审核	2026-03-31 16:41:25.511995
1608	920	手工乌日末液体	0		procure_in_reverse	-10	108	98	CGRK202603313280	采购入库反审核	2026-04-03 07:15:20.463277
1613	860	普通瓜子	0		procure_in_reverse	-10	15	5	CGRK202603313622	采购入库反审核	2026-04-03 07:15:23.179689
1617	916	脆奶条/散装/科尔沁	0		procure_in_reverse	-10	70	60	CGRK202603314323	采购入库反审核	2026-04-03 07:15:25.967787
1621	838	奶粉蒙古国	0		procure_in_reverse	-3	3	0	CGRK202603318071	采购入库反审核	2026-04-03 07:15:28.726647
1622	839	奶皮子粉	0		procure_in_reverse	-4	4	0	CGRK202603318071	采购入库反审核	2026-04-03 07:15:28.735005
1623	840	奶茶粉战粮	0		procure_in_reverse	-2	2	0	CGRK202603318071	采购入库反审核	2026-04-03 07:15:28.744396
1624	841	奶茶粉贡格尔	0		procure_in_reverse	-2	2	0	CGRK202603318071	采购入库反审核	2026-04-03 07:15:28.753191
1625	842	努德勒沁调和茶	0		procure_in_reverse	-2	2	0	CGRK202603318071	采购入库反审核	2026-04-03 07:15:28.762043
1626	843	阿依古丽奶茶专用红茶	0		procure_in_reverse	-2	2	0	CGRK202603318071	采购入库反审核	2026-04-03 07:15:28.770417
1627	844	希日嘎拉奶茶专用茶	0		procure_in_reverse	-2	4	2	CGRK202603318071	采购入库反审核	2026-04-03 07:15:28.778567
1628	837	甜味奶豆腐块儿/大	0		procure_in_reverse	-5	5	0	CGRK202603318071	采购入库反审核	2026-04-03 07:15:28.786759
1629	844	希日嘎拉奶茶专用茶	0		procure_in_reverse	-2	2	0	CGRK202603318071	采购入库反审核	2026-04-03 07:15:28.794858
1631	902	乌日莫糖/散装	0		procure_in_reverse	-5	25	20	CGRK202603312174	采购入库反审核	2026-04-03 07:15:31.462425
1632	922	酸奶炒米糖/散装	0		procure_in_reverse	-5	19	14	CGRK202603312174	采购入库反审核	2026-04-03 07:15:31.471649
1633	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-5	24	19	CGRK202603312174	采购入库反审核	2026-04-03 07:15:31.483219
1634	856	科尔沁/大奶豆腐	0		procure_in_reverse	-5	8	3	CGRK202603312174	采购入库反审核	2026-04-03 07:15:31.491408
1665	1014	散装/甜味奶条	0		procure_in_reverse	-53	165	112	CGRK202603314896	采购入库反审核	2026-04-03 07:16:02.26852
1666	866	酸奶/纯净	0		procure_in_reverse	-10	10	0	CGRK202603314814	采购入库反审核	2026-04-03 07:16:03.604033
1668	920	手工乌日末液体	0		procure_in_reverse	-10	78	68	CGRK202603312715	采购入库反审核	2026-04-03 07:16:06.45412
1669	970	热奶豆腐碗	0		procure_in_reverse	-36	136	100	CGRK202603312715	采购入库反审核	2026-04-03 07:16:06.463076
1670	939	半成品/透明/原味/鲜奶酪	0		procure_in_reverse	-20	100	80	CGRK202603312715	采购入库反审核	2026-04-03 07:16:06.471667
1671	940	半成品/透明/甜味/鲜奶酪	0		procure_in_reverse	-52	132	80	CGRK202603312715	采购入库反审核	2026-04-03 07:16:06.480407
1675	918	黄油/半斤	0		procure_in_reverse	-5	9	4	CGRK202603316006	采购入库反审核	2026-04-03 07:16:09.197801
1676	919	黄油/斤	0		procure_in_reverse	-5	13	8	CGRK202603316006	采购入库反审核	2026-04-03 07:16:09.20597
1677	885	冻炒米/散装	0		procure_in_reverse	-10	36	26	CGRK202603316006	采购入库反审核	2026-04-03 07:16:09.214136
1680	869	青砖碎茶	0		procure_in_reverse	-1	1	0	CGRK202603312281	采购入库反审核	2026-04-03 07:16:10.637651
1681	867	5g/青砖袋泡茶	0		procure_in_reverse	-1	1	0	CGRK202603312281	采购入库反审核	2026-04-03 07:16:10.646239
1682	868	16g青砖袋泡茶	0		procure_in_reverse	-1	1	0	CGRK202603312281	采购入库反审核	2026-04-03 07:16:10.654661
1683	878	羊奶粉/1斤	0		procure_in_reverse	-6	6	0	CGRK202603317078	采购入库反审核	2026-04-03 07:16:12.046656
1684	1014	散装/甜味奶条	0		procure_in_reverse	-19	112	93	CGRK202603318850	采购入库反审核	2026-04-03 07:16:13.527486
1685	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-5	19	14	CGRK202603315913	采购入库反审核	2026-04-03 07:16:15.126893
1686	884	实惠/奶豆腐	0		procure_in_reverse	-9	28	19	CGRK202603313988	采购入库反审核	2026-04-03 07:16:16.7266
1687	920	手工乌日末液体	0		procure_in_reverse	-10	68	58	CGRK202603313988	采购入库反审核	2026-04-03 07:16:16.736503
1688	880	阿润月饼/五仁馅	0		procure_in_reverse	-4	8	4	CGRK202603313167	采购入库反审核	2026-04-03 07:16:18.263426
1689	879	干肉奶茶	0		procure_in_reverse	-4	8	4	CGRK202603313167	采购入库反审核	2026-04-03 07:16:18.271677
1690	881	阿润月饼/奶皮子馅	0		procure_in_reverse	-4	8	4	CGRK202603313167	采购入库反审核	2026-04-03 07:16:18.280007
1691	882	阿润月饼/黄油渣馅	0		procure_in_reverse	-4	8	4	CGRK202603313167	采购入库反审核	2026-04-03 07:16:18.288696
1692	883	阿润月饼/奶豆腐馅	0		procure_in_reverse	-4	8	4	CGRK202603313167	采购入库反审核	2026-04-03 07:16:18.35997
1700	1024	标签/不干胶/奶条/甜味	0		procure_in_reverse	-500	1087	587	CGRK202603316909	采购入库反审核	2026-04-03 07:16:21.187997
1702	983	甜味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-500	550	50	CGRK202603312826	采购入库反审核	2026-04-03 07:16:23.946487
1703	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-500	1690	1190	CGRK202603312826	采购入库反审核	2026-04-03 07:16:23.954953
1693	946	半成品/透明/鲜奶皮	0		procure_in_reverse	-40	138	98	CGRK202603313660	采购入库反审核	2026-04-03 07:16:19.742445
1694	945	半成品/透明/奶皮卷	0		procure_in_reverse	-50	182	132	CGRK202603313660	采购入库反审核	2026-04-03 07:16:19.752057
1695	944	半成品/透明/奶皮千层	0		procure_in_reverse	-20	40	20	CGRK202603313660	采购入库反审核	2026-04-03 07:16:19.761509
1696	974	纯净黄油/瓶装好的	0		procure_in_reverse	-35	134	99	CGRK202603313660	采购入库反审核	2026-04-03 07:16:19.770499
1697	899	纯净/黄油/斤	0		procure_in_reverse	-10	32	22	CGRK202603313660	采购入库反审核	2026-04-03 07:16:19.779324
1698	920	手工乌日末液体	0		procure_in_reverse	-4	58	54	CGRK202603313660	采购入库反审核	2026-04-03 07:16:19.787471
1699	968	大/奶皮	0		procure_in_reverse	-30	120	90	CGRK202603313660	采购入库反审核	2026-04-03 07:16:19.795569
1701	898	透专标签/奶皮千层	0		procure_in_reverse	-500	500	0	CGRK202603313318	采购入库反审核	2026-04-03 07:16:22.557702
1704	884	实惠/奶豆腐	0		procure_in_reverse	-9	19	10	CGRK202603313621	采购入库反审核	2026-04-03 07:16:25.330801
1705	920	手工乌日末液体	0		procure_in_reverse	-10	54	44	CGRK202603313621	采购入库反审核	2026-04-03 07:16:25.339621
1706	880	阿润月饼/五仁馅	0		procure_in_reverse	-4	4	0	CGRK202603319433	采购入库反审核	2026-04-03 07:16:26.902552
1707	879	干肉奶茶	0		procure_in_reverse	-4	4	0	CGRK202603319433	采购入库反审核	2026-04-03 07:16:26.911345
1708	881	阿润月饼/奶皮子馅	0		procure_in_reverse	-4	4	0	CGRK202603319433	采购入库反审核	2026-04-03 07:16:26.919848
1709	882	阿润月饼/黄油渣馅	0		procure_in_reverse	-4	4	0	CGRK202603319433	采购入库反审核	2026-04-03 07:16:26.928363
1710	883	阿润月饼/奶豆腐馅	0		procure_in_reverse	-4	4	0	CGRK202603319433	采购入库反审核	2026-04-03 07:16:26.937096
1711	946	半成品/透明/鲜奶皮	0		procure_in_reverse	-40	98	58	CGRK202603312735	采购入库反审核	2026-04-03 07:16:28.409909
1712	945	半成品/透明/奶皮卷	0		procure_in_reverse	-50	132	82	CGRK202603312735	采购入库反审核	2026-04-03 07:16:28.41797
1713	944	半成品/透明/奶皮千层	0		procure_in_reverse	-20	20	0	CGRK202603312735	采购入库反审核	2026-04-03 07:16:28.426905
1714	974	纯净黄油/瓶装好的	0		procure_in_reverse	-35	99	64	CGRK202603312735	采购入库反审核	2026-04-03 07:16:28.435032
1715	899	纯净/黄油/斤	0		procure_in_reverse	-10	22	12	CGRK202603312735	采购入库反审核	2026-04-03 07:16:28.443165
1716	920	手工乌日末液体	0		procure_in_reverse	-4	44	40	CGRK202603312735	采购入库反审核	2026-04-03 07:16:28.452588
1717	968	大/奶皮	0		procure_in_reverse	-30	90	60	CGRK202603312735	采购入库反审核	2026-04-03 07:16:28.461232
1718	1024	标签/不干胶/奶条/甜味	0		procure_in_reverse	-500	587	87	CGRK202603312169	采购入库反审核	2026-04-03 07:16:30.04786
1719	889	奶皮卷/科尔沁	0		procure_in_reverse	-10	34	24	CGRK202603315278	采购入库反审核	2026-04-03 07:16:31.549543
1720	889	奶皮卷/科尔沁	0		procure_in_reverse	-10	24	14	CGRK202603312674	采购入库反审核	2026-04-03 07:16:32.998684
1721	945	半成品/透明/奶皮卷	0		procure_in_reverse	-25	82	57	CGRK202603312304	采购入库反审核	2026-04-03 07:16:34.500718
1722	945	半成品/透明/奶皮卷	0		procure_in_reverse	-25	57	32	CGRK202603312506	采购入库反审核	2026-04-03 07:16:36.074032
1723	885	冻炒米/散装	0		procure_in_reverse	-13	26	13	CGRK202603316789	采购入库反审核	2026-04-03 07:16:37.697662
1724	884	实惠/奶豆腐	0		procure_in_reverse	-5	10	5	CGRK202603316789	采购入库反审核	2026-04-03 07:16:37.706457
1725	924	冻炒米/袋装	0		procure_in_reverse	-10	30	20	CGRK202603316789	采购入库反审核	2026-04-03 07:16:37.714764
1726	885	冻炒米/散装	0		procure_in_reverse	-13	13	0	CGRK202603316714	采购入库反审核	2026-04-03 07:16:39.177056
1727	884	实惠/奶豆腐	0		procure_in_reverse	-5	5	0	CGRK202603316714	采购入库反审核	2026-04-03 07:16:39.185429
1728	924	冻炒米/袋装	0		procure_in_reverse	-10	20	10	CGRK202603316714	采购入库反审核	2026-04-03 07:16:39.193491
1729	890	红枣	0		procure_in_reverse	-12	24	12	CGRK202603313188	采购入库反审核	2026-04-03 07:16:40.625685
1730	973	精品/奶豆腐块儿/甜味/	0		procure_in_reverse	-17	74	57	CGRK202603314149	采购入库反审核	2026-04-03 07:16:42.093083
1731	986	精品/奶豆腐块儿/原味	0		procure_in_reverse	-50	140	90	CGRK202603314149	采购入库反审核	2026-04-03 07:16:42.102284
1732	916	脆奶条/散装/科尔沁	0		procure_in_reverse	-20	60	40	CGRK202603315580	采购入库反审核	2026-04-03 07:16:43.557761
1733	889	奶皮卷/科尔沁	0		procure_in_reverse	-7	14	7	CGRK202603315580	采购入库反审核	2026-04-03 07:16:43.566475
1734	886	冻炒米/科尔沁	0		procure_in_reverse	-2	4	2	CGRK202603315580	采购入库反审核	2026-04-03 07:16:43.575062
1735	887	羊乳奶粉/奶茶专用	0		procure_in_reverse	-4	8	4	CGRK202603315580	采购入库反审核	2026-04-03 07:16:43.58396
1736	888	河套奶粉	0		procure_in_reverse	-4	8	4	CGRK202603315580	采购入库反审核	2026-04-03 07:16:43.592681
1737	890	红枣	0		procure_in_reverse	-12	12	0	CGRK202603319636	采购入库反审核	2026-04-03 07:16:47.232106
1738	973	精品/奶豆腐块儿/甜味/	0		procure_in_reverse	-17	57	40	CGRK202603315779	采购入库反审核	2026-04-03 07:16:49.089098
1739	986	精品/奶豆腐块儿/原味	0		procure_in_reverse	-50	90	40	CGRK202603315779	采购入库反审核	2026-04-03 07:16:49.097864
1740	916	脆奶条/散装/科尔沁	0		procure_in_reverse	-20	40	20	CGRK202603314619	采购入库反审核	2026-04-03 07:16:50.721121
1741	889	奶皮卷/科尔沁	0		procure_in_reverse	-7	7	0	CGRK202603314619	采购入库反审核	2026-04-03 07:16:50.729407
1742	886	冻炒米/科尔沁	0		procure_in_reverse	-2	2	0	CGRK202603314619	采购入库反审核	2026-04-03 07:16:50.738263
1743	887	羊乳奶粉/奶茶专用	0		procure_in_reverse	-4	4	0	CGRK202603314619	采购入库反审核	2026-04-03 07:16:50.74794
1744	888	河套奶粉	0		procure_in_reverse	-4	4	0	CGRK202603314619	采购入库反审核	2026-04-03 07:16:50.765844
1745	1014	散装/甜味奶条	0		procure_in_reverse	-23	93	70	CGRK202603314424	采购入库反审核	2026-04-03 07:16:52.257853
1746	1015	散装/原味奶条	0		procure_in_reverse	-12	135	123	CGRK202603311843	采购入库反审核	2026-04-03 07:16:53.747437
1747	1014	散装/甜味奶条	0		procure_in_reverse	-23	70	47	CGRK202603314244	采购入库反审核	2026-04-03 07:16:55.329735
1748	1015	散装/原味奶条	0		procure_in_reverse	-12	123	111	CGRK202603317384	采购入库反审核	2026-04-03 07:16:56.91122
1749	902	乌日莫糖/散装	0		procure_in_reverse	-5	20	15	CGRK202603313871	采购入库反审核	2026-04-03 07:16:58.460484
1750	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-5	14	9	CGRK202603313871	采购入库反审核	2026-04-03 07:16:58.468733
1751	922	酸奶炒米糖/散装	0		procure_in_reverse	-5	14	9	CGRK202603313871	采购入库反审核	2026-04-03 07:16:58.477325
1752	891	芝士奶豆腐月饼	0		procure_in_reverse	-10	20	10	CGRK202603316826	采购入库反审核	2026-04-03 07:16:59.832739
1753	893	奶豆腐月饼	0		procure_in_reverse	-10	20	10	CGRK202603316826	采购入库反审核	2026-04-03 07:16:59.841336
1754	892	那牧尔酸奶	0		procure_in_reverse	-10	20	10	CGRK202603316826	采购入库反审核	2026-04-03 07:16:59.850419
1755	895	黄油渣月饼	0		procure_in_reverse	-10	20	10	CGRK202603316826	采购入库反审核	2026-04-03 07:16:59.858972
1756	896	奶皮月饼	0		procure_in_reverse	-10	20	10	CGRK202603316826	采购入库反审核	2026-04-03 07:16:59.867643
1757	897	早餐包/那牧尔	0		procure_in_reverse	-10	20	10	CGRK202603316826	采购入库反审核	2026-04-03 07:16:59.875976
1758	894	酸奶月饼	0		procure_in_reverse	-10	20	10	CGRK202603316826	采购入库反审核	2026-04-03 07:16:59.884584
1762	891	芝士奶豆腐月饼	0		procure_in_reverse	-10	10	0	CGRK202603315807	采购入库反审核	2026-04-03 07:17:03.044839
1763	893	奶豆腐月饼	0		procure_in_reverse	-10	10	0	CGRK202603315807	采购入库反审核	2026-04-03 07:17:03.053548
1764	892	那牧尔酸奶	0		procure_in_reverse	-10	10	0	CGRK202603315807	采购入库反审核	2026-04-03 07:17:03.061945
1765	895	黄油渣月饼	0		procure_in_reverse	-10	10	0	CGRK202603315807	采购入库反审核	2026-04-03 07:17:03.070528
1766	896	奶皮月饼	0		procure_in_reverse	-10	10	0	CGRK202603315807	采购入库反审核	2026-04-03 07:17:03.078752
1767	897	早餐包/那牧尔	0		procure_in_reverse	-10	10	0	CGRK202603315807	采购入库反审核	2026-04-03 07:17:03.087695
1768	894	酸奶月饼	0		procure_in_reverse	-10	10	0	CGRK202603315807	采购入库反审核	2026-04-03 07:17:03.160072
1771	920	手工乌日末液体	0		procure_in_reverse	-10	30	20	CGRK202603311412	采购入库反审核	2026-04-03 07:17:06.123695
1772	917	机器乌日末液体	0		procure_in_reverse	-4	8	4	CGRK202603311412	采购入库反审核	2026-04-03 07:17:06.132517
1775	1013	冻炒米/给组装半成品/那牧尔	0		procure_in_reverse	-100	513	413	CGRK202603317749	采购入库反审核	2026-04-03 07:17:09.331866
1778	1013	冻炒米/给组装半成品/那牧尔	0		procure_in_reverse	-100	413	313	CGRK202603315380	采购入库反审核	2026-04-03 07:17:12.400299
1783	1015	散装/原味奶条	0		procure_in_reverse	-31	111	80	CGRK202603311418	采购入库反审核	2026-04-03 07:17:15.520669
1785	900	透专标签/脆香奶条/微甜	0		procure_in_reverse	-500	1000	500	CGRK202603319871	采购入库反审核	2026-04-03 07:17:18.479304
1786	950	透专标签/奶皮卷	0		procure_in_reverse	-500	2000	1500	CGRK202603319871	采购入库反审核	2026-04-03 07:17:18.488243
1787	951	透专标签/冻炒米	0		procure_in_reverse	-500	2000	1500	CGRK202603319871	采购入库反审核	2026-04-03 07:17:18.496862
1788	952	透专标签/奶酪/原味	0		procure_in_reverse	-500	2000	1500	CGRK202603319871	采购入库反审核	2026-04-03 07:17:18.506074
1789	953	透专标签/奶酪/甜味	0		procure_in_reverse	-500	2000	1500	CGRK202603319871	采购入库反审核	2026-04-03 07:17:18.51654
1790	956	透专标签/鲜奶皮	0		procure_in_reverse	-500	2000	1500	CGRK202603319871	采购入库反审核	2026-04-03 07:17:18.525689
1792	929	白砂糖	0		procure_in_reverse	-6	16	10	CGRK202603314799	采购入库反审核	2026-04-03 07:17:21.476004
1797	1015	散装/原味奶条	0		procure_in_reverse	-31	80	49	CGRK202603313522	采购入库反审核	2026-04-03 07:17:24.467507
1799	900	透专标签/脆香奶条/微甜	0		procure_in_reverse	-500	500	0	CGRK202603315560	采购入库反审核	2026-04-03 07:17:27.331903
1800	950	透专标签/奶皮卷	0		procure_in_reverse	-500	1500	1000	CGRK202603315560	采购入库反审核	2026-04-03 07:17:27.340864
1801	951	透专标签/冻炒米	0		procure_in_reverse	-500	1500	1000	CGRK202603315560	采购入库反审核	2026-04-03 07:17:27.350355
1802	952	透专标签/奶酪/原味	0		procure_in_reverse	-500	1500	1000	CGRK202603315560	采购入库反审核	2026-04-03 07:17:27.358517
1803	953	透专标签/奶酪/甜味	0		procure_in_reverse	-500	1500	1000	CGRK202603315560	采购入库反审核	2026-04-03 07:17:27.366586
1804	956	透专标签/鲜奶皮	0		procure_in_reverse	-500	1500	1000	CGRK202603315560	采购入库反审核	2026-04-03 07:17:27.37471
1806	929	白砂糖	0		procure_in_reverse	-6	10	4	CGRK202603314637	采购入库反审核	2026-04-03 07:17:30.274857
1808	922	酸奶炒米糖/散装	0		procure_in_reverse	-1	4	3	CGRK202603315061	采购入库反审核	2026-04-03 07:17:33.148105
1809	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-1	4	3	CGRK202603315061	采购入库反审核	2026-04-03 07:17:33.156416
1826	923	炒米/散装/硬口	0		procure_in_reverse	-1	1	0	CGRK202603317247	采购入库反审核	2026-04-03 07:17:36.247398
1829	907	风干牛肉500g大片	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-04-03 07:17:39.22396
1830	908	哈斯乌拉牛肉干500g原味	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-04-03 07:17:39.23193
1831	909	蓝旗绿乳糖惠虹糖	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-04-03 07:17:39.23997
1832	910	蓝旗绿乳糖奶香酥	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-04-03 07:17:39.247939
1833	911	蓝旗绿乳糖果仁酥	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-04-03 07:17:39.256162
1834	912	蓝旗绿乳糖水果	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-04-03 07:17:39.26377
1835	913	蓝旗绿乳糖黄油球	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-04-03 07:17:39.272364
1836	914	蓝旗绿乳糖炼乳	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-04-03 07:17:39.280965
1837	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-1	1	0	CGRK202603312692	采购入库反审核	2026-04-03 07:17:39.289054
1838	922	酸奶炒米糖/散装	0		procure_in_reverse	-1	1	0	CGRK202603312692	采购入库反审核	2026-04-03 07:17:39.297442
1839	915	黄油渣/盒	0		procure_in_reverse	-4	4	0	CGRK202603312692	采购入库反审核	2026-04-03 07:17:39.305457
1840	916	脆奶条/散装/科尔沁	0		procure_in_reverse	-10	10	0	CGRK202603312692	采购入库反审核	2026-04-03 07:17:39.313402
1841	905	真空奶豆腐砖/甜味	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-04-03 07:17:39.321171
1842	906	真空奶豆腐砖/原味	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-04-03 07:17:39.330238
1843	903	盛宇燃奶豆腐/甜味	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-04-03 07:17:39.338278
1844	904	盛宇燃奶豆腐/原味	0		procure_in_reverse	-2	2	0	CGRK202603312692	采购入库反审核	2026-04-03 07:17:39.359626
1850	873	专袋/牛肉干包装	0		procure_in_reverse	-3000	3000	0	CGRK202603317882	采购入库反审核	2026-04-03 07:17:42.216539
1858	1013	冻炒米/给组装半成品/那牧尔	0		procure_in_reverse	-40	113	73	CGRK202603318027	采购入库反审核	2026-04-03 07:17:46.488894
1759	902	乌日莫糖/散装	0		procure_in_reverse	-5	15	10	CGRK202603313985	采购入库反审核	2026-04-03 07:17:01.538856
1760	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-5	9	4	CGRK202603313985	采购入库反审核	2026-04-03 07:17:01.548383
1761	922	酸奶炒米糖/散装	0		procure_in_reverse	-5	9	4	CGRK202603313985	采购入库反审核	2026-04-03 07:17:01.556975
1769	920	手工乌日末液体	0		procure_in_reverse	-10	40	30	CGRK202603315838	采购入库反审核	2026-04-03 07:17:04.631383
1770	917	机器乌日末液体	0		procure_in_reverse	-4	12	8	CGRK202603315838	采购入库反审核	2026-04-03 07:17:04.639972
1773	899	纯净/黄油/斤	0		procure_in_reverse	-6	12	6	CGRK202603316842	采购入库反审核	2026-04-03 07:17:07.804434
1774	945	半成品/透明/奶皮卷	0		procure_in_reverse	-10	32	22	CGRK202603316842	采购入库反审核	2026-04-03 07:17:07.812581
1776	899	纯净/黄油/斤	0		procure_in_reverse	-6	6	0	CGRK202603313127	采购入库反审核	2026-04-03 07:17:10.988464
1777	945	半成品/透明/奶皮卷	0		procure_in_reverse	-10	22	12	CGRK202603313127	采购入库反审核	2026-04-03 07:17:10.998577
1779	901	手工白花炒米/散装	0		procure_in_reverse	-30	60	30	CGRK202603314294	采购入库反审核	2026-04-03 07:17:13.952575
1780	902	乌日莫糖/散装	0		procure_in_reverse	-5	10	5	CGRK202603314294	采购入库反审核	2026-04-03 07:17:13.960758
1781	915	黄油渣/盒	0		procure_in_reverse	-4	16	12	CGRK202603314294	采购入库反审核	2026-04-03 07:17:13.977779
1782	981	烤奶皮	0		procure_in_reverse	-10	34	24	CGRK202603314294	采购入库反审核	2026-04-03 07:17:13.986683
1784	1013	冻炒米/给组装半成品/那牧尔	0		procure_in_reverse	-100	313	213	CGRK202603318659	采购入库反审核	2026-04-03 07:17:17.029031
1791	1010	奶油球	0		procure_in_reverse	-20	68	48	CGRK202603316302	采购入库反审核	2026-04-03 07:17:20.028263
1793	901	手工白花炒米/散装	0		procure_in_reverse	-30	30	0	CGRK202603316269	采购入库反审核	2026-04-03 07:17:22.959782
1794	902	乌日莫糖/散装	0		procure_in_reverse	-5	5	0	CGRK202603316269	采购入库反审核	2026-04-03 07:17:22.968819
1795	915	黄油渣/盒	0		procure_in_reverse	-4	12	8	CGRK202603316269	采购入库反审核	2026-04-03 07:17:22.977022
1796	981	烤奶皮	0		procure_in_reverse	-10	24	14	CGRK202603316269	采购入库反审核	2026-04-03 07:17:22.98474
1798	1013	冻炒米/给组装半成品/那牧尔	0		procure_in_reverse	-100	213	113	CGRK202603314722	采购入库反审核	2026-04-03 07:17:25.921889
1805	1010	奶油球	0		procure_in_reverse	-20	48	28	CGRK202603317292	采购入库反审核	2026-04-03 07:17:28.843564
1807	923	炒米/散装/硬口	0		procure_in_reverse	-1	2	1	CGRK202603311073	采购入库反审核	2026-04-03 07:17:31.666109
1810	907	风干牛肉500g大片	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-04-03 07:17:34.612368
1811	908	哈斯乌拉牛肉干500g原味	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-04-03 07:17:34.620551
1812	909	蓝旗绿乳糖惠虹糖	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-04-03 07:17:34.628776
1813	910	蓝旗绿乳糖奶香酥	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-04-03 07:17:34.637222
1814	911	蓝旗绿乳糖果仁酥	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-04-03 07:17:34.645427
1815	912	蓝旗绿乳糖水果	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-04-03 07:17:34.653626
1816	913	蓝旗绿乳糖黄油球	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-04-03 07:17:34.661869
1817	914	蓝旗绿乳糖炼乳	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-04-03 07:17:34.670063
1818	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-1	3	2	CGRK202603316985	采购入库反审核	2026-04-03 07:17:34.67798
1819	922	酸奶炒米糖/散装	0		procure_in_reverse	-1	3	2	CGRK202603316985	采购入库反审核	2026-04-03 07:17:34.685969
1820	915	黄油渣/盒	0		procure_in_reverse	-4	8	4	CGRK202603316985	采购入库反审核	2026-04-03 07:17:34.693748
1821	916	脆奶条/散装/科尔沁	0		procure_in_reverse	-10	20	10	CGRK202603316985	采购入库反审核	2026-04-03 07:17:34.701877
1822	905	真空奶豆腐砖/甜味	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-04-03 07:17:34.712501
1823	906	真空奶豆腐砖/原味	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-04-03 07:17:34.721031
1824	903	盛宇燃奶豆腐/甜味	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-04-03 07:17:34.730262
1825	904	盛宇燃奶豆腐/原味	0		procure_in_reverse	-2	4	2	CGRK202603316985	采购入库反审核	2026-04-03 07:17:34.738068
1827	922	酸奶炒米糖/散装	0		procure_in_reverse	-1	2	1	CGRK202603318149	采购入库反审核	2026-04-03 07:17:37.663281
1828	921	嚼口脆炒米糖/散装	0		procure_in_reverse	-1	2	1	CGRK202603318149	采购入库反审核	2026-04-03 07:17:37.672171
1845	924	冻炒米/袋装	0		procure_in_reverse	-5	10	5	CGRK202603312165	采购入库反审核	2026-04-03 07:17:40.793147
1846	917	机器乌日末液体	0		procure_in_reverse	-2	4	2	CGRK202603312165	采购入库反审核	2026-04-03 07:17:40.801959
1847	920	手工乌日末液体	0		procure_in_reverse	-10	20	10	CGRK202603312165	采购入库反审核	2026-04-03 07:17:40.810748
1848	918	黄油/半斤	0		procure_in_reverse	-2	4	2	CGRK202603312165	采购入库反审核	2026-04-03 07:17:40.819503
1849	919	黄油/斤	0		procure_in_reverse	-4	8	4	CGRK202603312165	采购入库反审核	2026-04-03 07:17:40.827689
1851	924	冻炒米/袋装	0		procure_in_reverse	-5	5	0	CGRK202603317772	采购入库反审核	2026-04-03 07:17:43.615432
1852	917	机器乌日末液体	0		procure_in_reverse	-2	2	0	CGRK202603317772	采购入库反审核	2026-04-03 07:17:43.624846
1853	920	手工乌日末液体	0		procure_in_reverse	-10	10	0	CGRK202603317772	采购入库反审核	2026-04-03 07:17:43.63328
1854	918	黄油/半斤	0		procure_in_reverse	-2	2	0	CGRK202603317772	采购入库反审核	2026-04-03 07:17:43.642011
1855	919	黄油/斤	0		procure_in_reverse	-4	4	0	CGRK202603317772	采购入库反审核	2026-04-03 07:17:43.65397
1856	949	专袋/乌日莫/炒米	0		procure_in_reverse	-100	200	100	CGRK202603315624	采购入库反审核	2026-04-03 07:17:45.049699
1857	948	专袋/乌日莫	0		procure_in_reverse	-100	200	100	CGRK202603315624	采购入库反审核	2026-04-03 07:17:45.058304
1872	949	专袋/乌日莫/炒米	0		procure_in_reverse	-100	100	0	CGRK202603311851	采购入库反审核	2026-04-03 07:17:52.154573
1873	948	专袋/乌日莫	0		procure_in_reverse	-100	100	0	CGRK202603311851	采购入库反审核	2026-04-03 07:17:52.163708
1875	930	加沙奶豆腐	0		procure_in_reverse	-5	5	0	CGRK202603313573	采购入库反审核	2026-04-03 07:17:55.15736
1876	931	炒米粉/aag	0		procure_in_reverse	-10	10	0	CGRK202603313573	采购入库反审核	2026-04-03 07:17:55.165345
1859	930	加沙奶豆腐	0		procure_in_reverse	-5	10	5	CGRK202603318023	采购入库反审核	2026-04-03 07:17:47.918927
1860	931	炒米粉/aag	0		procure_in_reverse	-10	20	10	CGRK202603318023	采购入库反审核	2026-04-03 07:17:47.92769
1861	932	炒米海丰	0		procure_in_reverse	-10	20	10	CGRK202603318023	采购入库反审核	2026-04-03 07:17:47.936101
1862	929	白砂糖	0		procure_in_reverse	-2	4	2	CGRK202603317210	采购入库反审核	2026-04-03 07:17:49.309207
1863	1002	封口机/真空	0		procure_in_reverse	-1	3	2	CGRK202603317210	采购入库反审核	2026-04-03 07:17:49.31768
1864	928	塑料购物袋	0		procure_in_reverse	-300	600	300	CGRK202603317210	采购入库反审核	2026-04-03 07:17:49.32623
1865	926	大奶豆腐砖/1.2斤	0		procure_in_reverse	-19	38	19	CGRK202603313193	采购入库反审核	2026-04-03 07:17:50.69737
1866	927	小奶豆腐砖/1斤	0		procure_in_reverse	-20	40	20	CGRK202603313193	采购入库反审核	2026-04-03 07:17:50.705956
1867	925	小/无印花/奶豆腐砖/1斤	0		procure_in_reverse	-20	40	20	CGRK202603313193	采购入库反审核	2026-04-03 07:17:50.714443
1868	946	半成品/透明/鲜奶皮	0		procure_in_reverse	-29	58	29	CGRK202603313193	采购入库反审核	2026-04-03 07:17:50.722736
1869	945	半成品/透明/奶皮卷	0		procure_in_reverse	-6	12	6	CGRK202603313193	采购入库反审核	2026-04-03 07:17:50.731432
1870	939	半成品/透明/原味/鲜奶酪	0		procure_in_reverse	-40	80	40	CGRK202603313193	采购入库反审核	2026-04-03 07:17:50.742591
1871	940	半成品/透明/甜味/鲜奶酪	0		procure_in_reverse	-40	80	40	CGRK202603313193	采购入库反审核	2026-04-03 07:17:50.751385
1874	1013	冻炒米/给组装半成品/那牧尔	0		procure_in_reverse	-40	73	33	CGRK202603316103	采购入库反审核	2026-04-03 07:17:53.623622
1878	929	白砂糖	0		procure_in_reverse	-2	2	0	CGRK202603314923	采购入库反审核	2026-04-03 07:17:56.555843
1879	1002	封口机/真空	0		procure_in_reverse	-1	2	1	CGRK202603314923	采购入库反审核	2026-04-03 07:17:56.56522
1880	928	塑料购物袋	0		procure_in_reverse	-300	300	0	CGRK202603314923	采购入库反审核	2026-04-03 07:17:56.574631
1888	981	烤奶皮	0		procure_in_reverse	-7	14	7	CGRK202603312723	采购入库反审核	2026-04-03 07:17:59.446736
1892	963	小/方形/亚克力盒/	0		procure_in_reverse	-240	480	240	CGRK202603316560	采购入库反审核	2026-04-03 07:18:02.310412
1893	962	中/方形/亚克力盒/	0		procure_in_reverse	-258	516	258	CGRK202603316560	采购入库反审核	2026-04-03 07:18:02.319047
1894	960	三角/奶皮千层盒	0		procure_in_reverse	-200	400	200	CGRK202603316560	采购入库反审核	2026-04-03 07:18:02.327598
1895	961	扁盒/亚克力/带内托	0		procure_in_reverse	-300	600	300	CGRK202603316560	采购入库反审核	2026-04-03 07:18:02.335893
1896	959	大/牛薄脆盒/亚克力	0		procure_in_reverse	-246	492	246	CGRK202603316560	采购入库反审核	2026-04-03 07:18:02.344723
1897	958	小/长方/亚克力/乳清奶条盒	0		procure_in_reverse	-183	366	183	CGRK202603316560	采购入库反审核	2026-04-03 07:18:02.353111
1898	957	大/长方/亚克力/待用	0		procure_in_reverse	-180	360	180	CGRK202603316560	采购入库反审核	2026-04-03 07:18:02.361748
1908	981	烤奶皮	0		procure_in_reverse	-7	7	0	CGRK202603317710	采购入库反审核	2026-04-03 07:18:05.184904
1909	973	精品/奶豆腐块儿/甜味/	0		procure_in_reverse	-20	20	0	CGRK202603318332	采购入库反审核	2026-04-03 07:18:06.60944
1910	986	精品/奶豆腐块儿/原味	0		procure_in_reverse	-20	20	0	CGRK202603318332	采购入库反审核	2026-04-03 07:18:06.619139
1911	974	纯净黄油/瓶装好的	0		procure_in_reverse	-32	32	0	CGRK202603318332	采购入库反审核	2026-04-03 07:18:06.627462
1919	979	新茶包/纸	0		procure_in_reverse	-20000	20000	0	CGRK202603319374	采购入库反审核	2026-04-03 07:18:09.505577
1920	1020	标签/不干胶/奶果子	0		procure_in_reverse	-500	624	124	CGRK202603319374	采购入库反审核	2026-04-03 07:18:09.513891
1921	950	透专标签/奶皮卷	0		procure_in_reverse	-500	500	0	CGRK202603319374	采购入库反审核	2026-04-03 07:18:09.522136
1922	951	透专标签/冻炒米	0		procure_in_reverse	-500	500	0	CGRK202603319374	采购入库反审核	2026-04-03 07:18:09.540446
1923	952	透专标签/奶酪/原味	0		procure_in_reverse	-500	500	0	CGRK202603319374	采购入库反审核	2026-04-03 07:18:09.549001
1924	953	透专标签/奶酪/甜味	0		procure_in_reverse	-500	500	0	CGRK202603319374	采购入库反审核	2026-04-03 07:18:09.557064
1925	954	透专标签/乳清奶条/甜味	0		procure_in_reverse	-500	500	0	CGRK202603319374	采购入库反审核	2026-04-03 07:18:09.565302
1926	955	透专标签/乳清奶条/原味	0		procure_in_reverse	-500	500	0	CGRK202603319374	采购入库反审核	2026-04-03 07:18:09.573646
1927	956	透专标签/鲜奶皮	0		procure_in_reverse	-500	500	0	CGRK202603319374	采购入库反审核	2026-04-03 07:18:09.581969
1936	972	原味/散称/奶豆腐块儿	0		procure_in_reverse	-10	10	0	CGRK202603317488	采购入库反审核	2026-04-03 07:18:12.491888
1937	971	甜味/散称/奶豆腐块儿	0		procure_in_reverse	-10	10	0	CGRK202603317488	采购入库反审核	2026-04-03 07:18:12.500772
1938	965	半成品/透明/冻炒米	0		procure_in_reverse	-38	38	0	CGRK202603317488	采购入库反审核	2026-04-03 07:18:12.509011
1939	970	热奶豆腐碗	0		procure_in_reverse	-50	50	0	CGRK202603317488	采购入库反审核	2026-04-03 07:18:12.517493
1940	968	大/奶皮	0		procure_in_reverse	-30	30	0	CGRK202603317488	采购入库反审核	2026-04-03 07:18:12.526089
1941	969	小/奶皮	0		procure_in_reverse	-30	30	0	CGRK202603317488	采购入库反审核	2026-04-03 07:18:12.534662
1942	967	查嘎/乳清	0		procure_in_reverse	-5	5	0	CGRK202603317488	采购入库反审核	2026-04-03 07:18:12.542682
1943	966	查嘎粉/小包装袋	0		procure_in_reverse	-30	30	0	CGRK202603317488	采购入库反审核	2026-04-03 07:18:12.55067
1947	1027	真空袋	0		procure_in_reverse	-500	1080	580	CGRK202603313044	采购入库反审核	2026-04-03 07:18:16.722609
1949	1016	专瓶/黄油	0		procure_in_reverse	-240	295	55	CGRK202603312017	采购入库反审核	2026-04-03 07:18:19.523785
1950	862	专瓶/黄油渣	0		procure_in_reverse	-120	120	0	CGRK202603312017	采购入库反审核	2026-04-03 07:18:19.53193
1952	991	奶果子/散装	0		procure_in_reverse	-86	204	118	CGRK202603315015	采购入库反审核	2026-04-03 07:18:22.300037
1877	932	炒米海丰	0		procure_in_reverse	-10	10	0	CGRK202603313573	采购入库反审核	2026-04-03 07:17:55.173623
1881	926	大奶豆腐砖/1.2斤	0		procure_in_reverse	-19	19	0	CGRK202603316519	采购入库反审核	2026-04-03 07:17:57.945407
1882	927	小奶豆腐砖/1斤	0		procure_in_reverse	-20	20	0	CGRK202603316519	采购入库反审核	2026-04-03 07:17:57.953474
1883	925	小/无印花/奶豆腐砖/1斤	0		procure_in_reverse	-20	20	0	CGRK202603316519	采购入库反审核	2026-04-03 07:17:57.962235
1884	946	半成品/透明/鲜奶皮	0		procure_in_reverse	-29	29	0	CGRK202603316519	采购入库反审核	2026-04-03 07:17:57.970466
1885	945	半成品/透明/奶皮卷	0		procure_in_reverse	-6	6	0	CGRK202603316519	采购入库反审核	2026-04-03 07:17:57.978488
1886	939	半成品/透明/原味/鲜奶酪	0		procure_in_reverse	-40	40	0	CGRK202603316519	采购入库反审核	2026-04-03 07:17:57.986425
1887	940	半成品/透明/甜味/鲜奶酪	0		procure_in_reverse	-40	40	0	CGRK202603316519	采购入库反审核	2026-04-03 07:17:57.994385
1889	973	精品/奶豆腐块儿/甜味/	0		procure_in_reverse	-20	40	20	CGRK202603316782	采购入库反审核	2026-04-03 07:18:00.876442
1890	986	精品/奶豆腐块儿/原味	0		procure_in_reverse	-20	40	20	CGRK202603316782	采购入库反审核	2026-04-03 07:18:00.889
1891	974	纯净黄油/瓶装好的	0		procure_in_reverse	-32	64	32	CGRK202603316782	采购入库反审核	2026-04-03 07:18:00.89923
1899	979	新茶包/纸	0		procure_in_reverse	-20000	40000	20000	CGRK202603312482	采购入库反审核	2026-04-03 07:18:03.730307
1900	1020	标签/不干胶/奶果子	0		procure_in_reverse	-500	1124	624	CGRK202603312482	采购入库反审核	2026-04-03 07:18:03.739539
1901	950	透专标签/奶皮卷	0		procure_in_reverse	-500	1000	500	CGRK202603312482	采购入库反审核	2026-04-03 07:18:03.748025
1902	951	透专标签/冻炒米	0		procure_in_reverse	-500	1000	500	CGRK202603312482	采购入库反审核	2026-04-03 07:18:03.757225
1903	952	透专标签/奶酪/原味	0		procure_in_reverse	-500	1000	500	CGRK202603312482	采购入库反审核	2026-04-03 07:18:03.765581
1904	953	透专标签/奶酪/甜味	0		procure_in_reverse	-500	1000	500	CGRK202603312482	采购入库反审核	2026-04-03 07:18:03.773308
1905	954	透专标签/乳清奶条/甜味	0		procure_in_reverse	-500	1000	500	CGRK202603312482	采购入库反审核	2026-04-03 07:18:03.781373
1906	955	透专标签/乳清奶条/原味	0		procure_in_reverse	-500	1000	500	CGRK202603312482	采购入库反审核	2026-04-03 07:18:03.789419
1907	956	透专标签/鲜奶皮	0		procure_in_reverse	-500	1000	500	CGRK202603312482	采购入库反审核	2026-04-03 07:18:03.797284
1912	963	小/方形/亚克力盒/	0		procure_in_reverse	-240	240	0	CGRK202603318706	采购入库反审核	2026-04-03 07:18:08.032549
1913	962	中/方形/亚克力盒/	0		procure_in_reverse	-258	258	0	CGRK202603318706	采购入库反审核	2026-04-03 07:18:08.043671
1914	960	三角/奶皮千层盒	0		procure_in_reverse	-200	200	0	CGRK202603318706	采购入库反审核	2026-04-03 07:18:08.051875
1915	961	扁盒/亚克力/带内托	0		procure_in_reverse	-300	300	0	CGRK202603318706	采购入库反审核	2026-04-03 07:18:08.060421
1916	959	大/牛薄脆盒/亚克力	0		procure_in_reverse	-246	246	0	CGRK202603318706	采购入库反审核	2026-04-03 07:18:08.0685
1917	958	小/长方/亚克力/乳清奶条盒	0		procure_in_reverse	-183	183	0	CGRK202603318706	采购入库反审核	2026-04-03 07:18:08.076951
1918	957	大/长方/亚克力/待用	0		procure_in_reverse	-180	180	0	CGRK202603318706	采购入库反审核	2026-04-03 07:18:08.085481
1928	972	原味/散称/奶豆腐块儿	0		procure_in_reverse	-10	20	10	CGRK202603318436	采购入库反审核	2026-04-03 07:18:10.984801
1929	971	甜味/散称/奶豆腐块儿	0		procure_in_reverse	-10	20	10	CGRK202603318436	采购入库反审核	2026-04-03 07:18:10.993265
1930	965	半成品/透明/冻炒米	0		procure_in_reverse	-38	76	38	CGRK202603318436	采购入库反审核	2026-04-03 07:18:11.00163
1931	970	热奶豆腐碗	0		procure_in_reverse	-50	100	50	CGRK202603318436	采购入库反审核	2026-04-03 07:18:11.010289
1932	968	大/奶皮	0		procure_in_reverse	-30	60	30	CGRK202603318436	采购入库反审核	2026-04-03 07:18:11.019061
1933	969	小/奶皮	0		procure_in_reverse	-30	60	30	CGRK202603318436	采购入库反审核	2026-04-03 07:18:11.027766
1934	967	查嘎/乳清	0		procure_in_reverse	-5	10	5	CGRK202603318436	采购入库反审核	2026-04-03 07:18:11.036621
1935	966	查嘎粉/小包装袋	0		procure_in_reverse	-30	60	30	CGRK202603318436	采购入库反审核	2026-04-03 07:18:11.045159
1944	982	塑料手提袋	0		procure_in_reverse	-5000	10000	5000	CGRK202603316912	采购入库反审核	2026-04-03 07:18:13.964098
1945	1016	专瓶/黄油	0		procure_in_reverse	-240	535	295	CGRK202603312940	采购入库反审核	2026-04-03 07:18:15.334935
1946	862	专瓶/黄油渣	0		procure_in_reverse	-120	240	120	CGRK202603312940	采购入库反审核	2026-04-03 07:18:15.343168
1948	982	塑料手提袋	0		procure_in_reverse	-5000	5000	0	CGRK202603317738	采购入库反审核	2026-04-03 07:18:18.135956
1951	1027	真空袋	0		procure_in_reverse	-500	580	80	CGRK202603312344	采购入库反审核	2026-04-03 07:18:20.92113
1953	991	奶果子/散装	0		procure_in_reverse	-86	118	32	CGRK202603313831	采购入库反审核	2026-04-03 07:18:23.657482
1954	1014	散装/甜味奶条	0		procure_in_reverse	-21	47	26	CGRK202603317227	采购入库反审核	2026-04-03 07:18:25.034453
1955	1000	木勺	0		procure_in_reverse	-10	212	202	CGRK202603317084	采购入库反审核	2026-04-03 07:18:26.47078
1956	995	茶专用/热缩膜	0		procure_in_reverse	-2600	2610	10	CGRK202603314460	采购入库反审核	2026-04-03 07:18:28.044744
1957	1002	封口机/真空	0		procure_in_reverse	-1	1	0	CGRK202603312389	采购入库反审核	2026-04-03 07:18:29.448735
1958	1001	冷冻柜/冰箱	0		procure_in_reverse	-1	1	0	CGRK202603317776	采购入库反审核	2026-04-03 07:18:30.963593
1959	1019	标签/不干胶/冻炒米	0		procure_in_reverse	-500	1500	1000	CGRK202603318283	采购入库反审核	2026-04-03 07:18:32.445415
1960	984	茶包/类腰封纸	0		procure_in_reverse	-2000	4000	2000	CGRK202603318283	采购入库反审核	2026-04-03 07:18:32.453909
1961	975	黄油脖签	0		procure_in_reverse	-500	1000	500	CGRK202603318283	采购入库反审核	2026-04-03 07:18:32.463086
1962	978	新茶专用标签纸	0		procure_in_reverse	-3000	6000	3000	CGRK202603318283	采购入库反审核	2026-04-03 07:18:32.471786
1963	983	甜味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-25	50	25	CGRK202603311075	采购入库反审核	2026-04-03 07:18:33.856538
1964	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-25	1190	1165	CGRK202603311075	采购入库反审核	2026-04-03 07:18:33.864701
1965	999	茶专用/不干胶/标签	0		procure_in_reverse	-60	1120	1060	CGRK202603311075	采购入库反审核	2026-04-03 07:18:33.872848
1966	1019	标签/不干胶/冻炒米	0		procure_in_reverse	-500	1000	500	CGRK202603317281	采购入库反审核	2026-04-03 07:18:35.232749
1967	984	茶包/类腰封纸	0		procure_in_reverse	-2000	2000	0	CGRK202603317281	采购入库反审核	2026-04-03 07:18:35.24107
1968	975	黄油脖签	0		procure_in_reverse	-500	500	0	CGRK202603317281	采购入库反审核	2026-04-03 07:18:35.249279
1969	978	新茶专用标签纸	0		procure_in_reverse	-3000	3000	0	CGRK202603317281	采购入库反审核	2026-04-03 07:18:35.258399
1973	1010	奶油球	0		procure_in_reverse	-10	28	18	CGRK202603314211	采购入库反审核	2026-04-03 07:18:38.148506
1974	997	茶专用/盐包	0		procure_in_reverse	-8	3770	3762	CGRK202603312404	采购入库反审核	2026-04-03 07:18:39.536597
1978	997	茶专用/盐包	0		procure_in_reverse	-3560	3762	202	CGRK202603319814	采购入库反审核	2026-04-03 07:18:42.470161
1980	1010	奶油球	0		procure_in_reverse	-10	18	8	CGRK202603315724	采购入库反审核	2026-04-03 07:18:45.605534
1982	1003	热收缩膜机	0		procure_in_reverse	-1	1	0	CGRK202603313416	采购入库反审核	2026-04-03 07:18:48.633105
1984	1015	散装/原味奶条	0		procure_in_reverse	-9	33	24	CGRK202603312582	采购入库反审核	2026-04-03 07:18:51.455412
1986	1014	散装/甜味奶条	0		procure_in_reverse	-16	26	10	CGRK202603317649	采购入库反审核	2026-04-03 07:18:54.232413
1987	1014	散装/甜味奶条	0		procure_in_reverse	-10	10	0	CGRK202603317649	采购入库反审核	2026-04-03 07:18:54.241323
1989	1009	专盒/青砖奶茶外盒	0		procure_in_reverse	-3030	3230	200	CGRK202603317409	采购入库反审核	2026-04-03 07:18:56.9883
1990	1015	散装/原味奶条	0		procure_in_reverse	-15	15	0	CGRK202603315894	采购入库反审核	2026-04-03 07:18:58.464574
1992	1011	茶包	0		procure_in_reverse	-8	8	0	CGRK202603311827	采购入库反审核	2026-04-03 07:19:01.228202
1995	1000	木勺	0		procure_in_reverse	-2	202	200	CGRK202603317862	采购入库反审核	2026-04-03 07:19:04.664977
1996	1000	木勺	0		procure_in_reverse	-200	200	0	CGRK202603317862	采购入库反审核	2026-04-03 07:19:04.673624
1999	995	茶专用/热缩膜	0		procure_in_reverse	-10	10	0	CGRK202603312868	采购入库反审核	2026-04-03 07:19:07.718811
2002	991	奶果子/散装	0		procure_in_reverse	-18	32	14	CGRK202603318731	采购入库反审核	2026-04-03 07:19:11.953526
2004	991	奶果子/散装	0		procure_in_reverse	-14	14	0	CGRK202603313009	采购入库反审核	2026-04-03 07:19:14.808751
2005	1033	专袋/奶条	0		procure_in_reverse	-51	463	412	CGRK202603318453	采购入库反审核	2026-04-03 07:19:16.18798
2006	1033	专袋/奶条	0		procure_in_reverse	-84	412	328	CGRK202603318453	采购入库反审核	2026-04-03 07:19:16.196707
2007	1033	专袋/奶条	0		procure_in_reverse	-2	328	326	CGRK202603318453	采购入库反审核	2026-04-03 07:19:16.205733
2008	1033	专袋/奶条	0		procure_in_reverse	-48	326	278	CGRK202603318453	采购入库反审核	2026-04-03 07:19:16.214326
2009	1032	专盒/冻炒米	0		procure_in_reverse	-32	1738	1706	CGRK202603311619	采购入库反审核	2026-04-03 07:19:17.558191
2012	1029	专内盒/奶果子	0		procure_in_reverse	-8	69	61	CGRK202603311805	采购入库反审核	2026-04-03 07:19:20.280665
2013	1030	专外盒/奶果子	0		procure_in_reverse	-6	46	40	CGRK202603311805	采购入库反审核	2026-04-03 07:19:20.288661
2015	1027	真空袋	0		procure_in_reverse	-60	80	20	CGRK202603316109	采购入库反审核	2026-04-03 07:19:23.020735
2020	1024	标签/不干胶/奶条/甜味	0		procure_in_reverse	-77	87	10	CGRK202603318548	采购入库反审核	2026-04-03 07:19:27.305727
2021	1023	标签/不干胶/奶条/原味	0		procure_in_reverse	-27	325	298	CGRK202603318548	采购入库反审核	2026-04-03 07:19:27.313598
2023	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-14	1140	1126	CGRK202603314892	采购入库反审核	2026-04-03 07:19:30.142784
2024	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-15	1126	1111	CGRK202603314892	采购入库反审核	2026-04-03 07:19:30.151215
2026	1019	标签/不干胶/冻炒米	0		procure_in_reverse	-500	500	0	CGRK202603318352	采购入库反审核	2026-04-03 07:19:32.91543
2027	1032	专盒/冻炒米	0		procure_in_reverse	-1650	1706	56	CGRK202603318352	采购入库反审核	2026-04-03 07:19:32.923952
2030	1017	手提袋	0		procure_in_reverse	-368	368	0	CGRK202603319888	采购入库反审核	2026-04-03 07:19:35.727813
2031	1033	专袋/奶条	0		procure_in_reverse	-80	278	198	CGRK202603319888	采购入库反审核	2026-04-03 07:19:35.736277
2032	1033	专袋/奶条	0		procure_in_reverse	-20	198	178	CGRK202603319888	采购入库反审核	2026-04-03 07:19:35.746491
2033	1033	专袋/奶条	0		procure_in_reverse	-86	178	92	CGRK202603319888	采购入库反审核	2026-04-03 07:19:35.755681
2034	1033	专袋/奶条	0		procure_in_reverse	-5	92	87	CGRK202603319888	采购入库反审核	2026-04-03 07:19:35.76381
2035	1031	专底盒/奶条	0		procure_in_reverse	-17	153	136	CGRK202603319888	采购入库反审核	2026-04-03 07:19:35.772574
2036	1031	专底盒/奶条	0		procure_in_reverse	-24	136	112	CGRK202603319888	采购入库反审核	2026-04-03 07:19:35.780582
2049	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-748	1111	363	CGRK202603316489	采购入库反审核	2026-04-03 07:19:38.713079
2050	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-9	363	354	CGRK202603316489	采购入库反审核	2026-04-03 07:19:38.721396
2051	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-260	354	94	CGRK202603316489	采购入库反审核	2026-04-03 07:19:38.730055
2052	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-76	94	18	CGRK202603316489	采购入库反审核	2026-04-03 07:19:38.738649
2053	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-18	18	0	CGRK202603316489	采购入库反审核	2026-04-03 07:19:38.747649
2056	1027	真空袋	0		procure_in_reverse	-20	20	0	CGRK202603311463	采购入库反审核	2026-04-03 07:19:41.592076
2058	1032	专盒/冻炒米	0		procure_in_reverse	-36	56	20	CGRK202603313100	采购入库反审核	2026-04-03 07:19:44.870158
2059	1032	专盒/冻炒米	0		procure_in_reverse	-20	20	0	CGRK202603313100	采购入库反审核	2026-04-03 07:19:44.878442
2060	1023	标签/不干胶/奶条/原味	0		procure_in_reverse	-298	298	0	CGRK202603313100	采购入库反审核	2026-04-03 07:19:44.888556
2061	1020	标签/不干胶/奶果子	0		procure_in_reverse	-111	111	0	CGRK202603313100	采购入库反审核	2026-04-03 07:19:44.896949
2062	1028	专标签/黄油	0		procure_in_reverse	-340	840	500	CGRK202603313100	采购入库反审核	2026-04-03 07:19:44.904705
2063	1028	专标签/黄油	0		procure_in_reverse	-500	500	0	CGRK202603313100	采购入库反审核	2026-04-03 07:19:44.912514
2064	1024	标签/不干胶/奶条/甜味	0		procure_in_reverse	-10	10	0	CGRK202603313100	采购入库反审核	2026-04-03 07:19:44.921008
1970	983	甜味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-25	25	0	CGRK202603313456	采购入库反审核	2026-04-03 07:18:36.708484
1971	1021	原味/标签/不干胶/传统奶豆腐	0		procure_in_reverse	-25	1165	1140	CGRK202603313456	采购入库反审核	2026-04-03 07:18:36.717534
1972	999	茶专用/不干胶/标签	0		procure_in_reverse	-60	1060	1000	CGRK202603313456	采购入库反审核	2026-04-03 07:18:36.725938
1975	989	蒙古黄油/瓶装成品	0		procure_in_reverse	-1	3	2	CGRK202603312720	采购入库反审核	2026-04-03 07:18:40.994053
1976	989	蒙古黄油/瓶装成品	0		procure_in_reverse	-2	2	0	CGRK202603312720	采购入库反审核	2026-04-03 07:18:41.003464
1977	988	原味传统奶豆腐/成品袋装	0		procure_in_reverse	-2	2	0	CGRK202603312720	采购入库反审核	2026-04-03 07:18:41.012382
1979	1013	冻炒米/给组装半成品/那牧尔	0		procure_in_reverse	-3	33	30	CGRK202603315166	采购入库反审核	2026-04-03 07:18:44.215192
1981	987	采购样品专用/乳制品	0		procure_in_reverse	-14	14	0	CGRK202603312742	采购入库反审核	2026-04-03 07:18:47.11602
1983	1015	散装/原味奶条	0		procure_in_reverse	-16	49	33	CGRK202603314584	采购入库反审核	2026-04-03 07:18:50.033926
1985	1015	散装/原味奶条	0		procure_in_reverse	-9	24	15	CGRK202603314191	采购入库反审核	2026-04-03 07:18:52.82622
1988	1013	冻炒米/给组装半成品/那牧尔	0		procure_in_reverse	-30	30	0	CGRK202603311843	采购入库反审核	2026-04-03 07:18:55.592573
1991	1010	奶油球	0		procure_in_reverse	-8	8	0	CGRK202603316571	采购入库反审核	2026-04-03 07:18:59.825857
1993	997	茶专用/盐包	0		procure_in_reverse	-2	202	200	CGRK202603314744	采购入库反审核	2026-04-03 07:19:02.754092
1994	997	茶专用/盐包	0		procure_in_reverse	-200	200	0	CGRK202603314744	采购入库反审核	2026-04-03 07:19:02.763165
1997	998	茶专用/硫酸纸	0		procure_in_reverse	-1000	1000	0	CGRK202603315535	采购入库反审核	2026-04-03 07:19:06.253609
1998	999	茶专用/不干胶/标签	0		procure_in_reverse	-1000	1000	0	CGRK202603315535	采购入库反审核	2026-04-03 07:19:06.264539
2000	1009	专盒/青砖奶茶外盒	0		procure_in_reverse	-200	200	0	CGRK202603318063	采购入库反审核	2026-04-03 07:19:09.137046
2001	993	冻炒米专用/塑膜袋	0		procure_in_reverse	-500	500	0	CGRK202603311837	采购入库反审核	2026-04-03 07:19:10.53236
2003	990	奶果子/专用塑膜袋	0		procure_in_reverse	-1000	1000	0	CGRK202603317539	采购入库反审核	2026-04-03 07:19:13.407606
2010	1031	专底盒/奶条	0		procure_in_reverse	-30	186	156	CGRK202603319931	采购入库反审核	2026-04-03 07:19:18.927962
2011	1031	专底盒/奶条	0		procure_in_reverse	-3	156	153	CGRK202603319931	采购入库反审核	2026-04-03 07:19:18.937424
2014	1028	专标签/黄油	0		procure_in_reverse	-16	856	840	CGRK202603318955	采购入库反审核	2026-04-03 07:19:21.651888
2016	1026	专内袋/奶果子	0		procure_in_reverse	-16	136	120	CGRK202603318147	采购入库反审核	2026-04-03 07:19:24.450264
2017	1026	专内袋/奶果子	0		procure_in_reverse	-13	120	107	CGRK202603318147	采购入库反审核	2026-04-03 07:19:24.458785
2018	1025	定制款/专内袋/扎那家奶果子	0		procure_in_reverse	-16	186	170	CGRK202603318163	采购入库反审核	2026-04-03 07:19:25.923241
2019	1025	定制款/专内袋/扎那家奶果子	0		procure_in_reverse	-170	170	0	CGRK202603318163	采购入库反审核	2026-04-03 07:19:25.9319
2022	1022	专袋/传统奶豆腐	0		procure_in_reverse	-90	192	102	CGRK202603318109	采购入库反审核	2026-04-03 07:19:28.753625
2025	1020	标签/不干胶/奶果子	0		procure_in_reverse	-13	124	111	CGRK202603311132	采购入库反审核	2026-04-03 07:19:31.498455
2028	1018	礼盒/蓝界	0		procure_in_reverse	-30	56	26	CGRK202603318644	采购入库反审核	2026-04-03 07:19:34.351375
2029	1018	礼盒/蓝界	0		procure_in_reverse	-26	26	0	CGRK202603318644	采购入库反审核	2026-04-03 07:19:34.359366
2037	1033	专袋/奶条	0		procure_in_reverse	-17	87	70	CGRK202603319881	采购入库反审核	2026-04-03 07:19:37.235844
2038	1033	专袋/奶条	0		procure_in_reverse	-16	70	54	CGRK202603319881	采购入库反审核	2026-04-03 07:19:37.24498
2039	1033	专袋/奶条	0		procure_in_reverse	-47	54	7	CGRK202603319881	采购入库反审核	2026-04-03 07:19:37.253814
2040	1033	专袋/奶条	0		procure_in_reverse	-7	7	0	CGRK202603319881	采购入库反审核	2026-04-03 07:19:37.262705
2041	1031	专底盒/奶条	0		procure_in_reverse	-79	112	33	CGRK202603319881	采购入库反审核	2026-04-03 07:19:37.271171
2042	1031	专底盒/奶条	0		procure_in_reverse	-33	33	0	CGRK202603319881	采购入库反审核	2026-04-03 07:19:37.280102
2043	1030	专外盒/奶果子	0		procure_in_reverse	-6	40	34	CGRK202603319881	采购入库反审核	2026-04-03 07:19:37.288816
2044	1030	专外盒/奶果子	0		procure_in_reverse	-34	34	0	CGRK202603319881	采购入库反审核	2026-04-03 07:19:37.297192
2045	1029	专内盒/奶果子	0		procure_in_reverse	-24	61	37	CGRK202603319881	采购入库反审核	2026-04-03 07:19:37.305791
2046	1029	专内盒/奶果子	0		procure_in_reverse	-37	37	0	CGRK202603319881	采购入库反审核	2026-04-03 07:19:37.314125
2047	1026	专内袋/奶果子	0		procure_in_reverse	-25	107	82	CGRK202603319881	采购入库反审核	2026-04-03 07:19:37.322487
2048	1026	专内袋/奶果子	0		procure_in_reverse	-82	82	0	CGRK202603319881	采购入库反审核	2026-04-03 07:19:37.331102
2054	1022	专袋/传统奶豆腐	0		procure_in_reverse	-79	102	23	CGRK202603317845	采购入库反审核	2026-04-03 07:19:40.197745
2055	1022	专袋/传统奶豆腐	0		procure_in_reverse	-23	23	0	CGRK202603317845	采购入库反审核	2026-04-03 07:19:40.205832
2057	1016	专瓶/黄油	0		procure_in_reverse	-55	55	0	CGRK202603312514	采购入库反审核	2026-04-03 07:19:43.487855
\.


--
-- Data for Name: stock_inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_inventory (id, goods_id, goods_name, goods_code, unit_name, warehouse_id, warehouse_name, qty, cost, update_time) FROM stdin;
94	837	甜味奶豆腐块儿/大	SP0000198	袋	0		0	0.00	2026-04-03 07:15:28.782757
65	829	奶豆腐/原味/中/科尔沁	SP0000207	张	0		0	0.00	2026-04-03 07:15:15.038315
114	970	热奶豆腐碗	SP0000064	盒	0		0	0.00	2026-04-03 07:18:12.513174
79	809	10斤装/小米/绿色纸盒	SP0000227	盒	0		0	0.00	2026-04-03 07:15:17.812698
51	1033	专袋/奶条	SP0000001	捆	0		0	0.00	2026-04-03 07:19:37.258396
81	880	阿润月饼/五仁馅	SP0000155	袋	0		0	0.00	2026-04-03 07:16:26.897989
118	885	冻炒米/散装	SP0000150	斤	0		0	0.00	2026-04-03 07:16:39.172839
110	997	茶专用/盐包	SP0000037	小包	0		0	0.00	2026-04-03 07:19:02.758516
68	907	风干牛肉500g大片	SP0000128	袋	0		0	0.00	2026-04-03 07:17:39.219954
61	806	德吉酸奶/半斤	SP0000230	瓶	0		0	0.00	2026-04-03 07:15:02.148085
104	879	干肉奶茶	SP0000156	盒	0		0	0.00	2026-04-03 07:16:26.906909
78	830	小米/10斤/小袋	SP0000206	袋	0		0	0.00	2026-04-03 07:15:17.803453
97	852	牛肉干/散/孜然	SP0000183	斤	0		0	0.00	2026-04-03 07:15:35.827031
109	861	五香瓜子	SP0000174	散	0		0	0.00	2026-04-03 07:15:53.595583
57	920	手工乌日末液体	SP0000115	斤	0		0	0.00	2026-04-03 07:17:43.629248
108	963	小/方形/亚克力盒/	SP0000071	盒	0		0	0.00	2026-04-03 07:18:08.028166
86	847	乌日莫/袋装	SP0000188	袋	0		0	0.00	2026-04-03 07:15:27.322734
80	860	普通瓜子	SP0000175	散	0		0	0.00	2026-04-03 07:15:53.587087
121	919	黄油/斤	SP0000116	瓶	0		0	0.00	2026-04-03 07:17:43.646733
122	870	大青砖茶砖	SP0000165	件	0		0	0.00	2026-04-03 07:16:10.61559
102	993	冻炒米专用/塑膜袋	SP0000041	张	0		0	0.00	2026-04-03 07:19:10.528061
73	822	黄油/大瓶/科尔沁	SP0000214	瓶	0		0	0.00	2026-04-03 07:15:09.20197
119	863	冻炒米/小包散/精品	SP0000172	个	0		0	0.00	2026-04-03 07:16:07.859795
63	908	哈斯乌拉牛肉干500g原味	SP0000127	袋	0		0	0.00	2026-04-03 07:17:39.228018
54	981	烤奶皮	SP0000053	斤	0		0	0.00	2026-04-03 07:18:05.180871
123	871	小青砖茶砖	SP0000164	件	0		0	0.00	2026-04-03 07:16:10.62466
98	853	牛肉干/散/香辣	SP0000182	斤	0		0	0.00	2026-04-03 07:15:35.83984
84	845	乳清饮料	SP0000190	瓶	0		0	0.00	2026-04-03 07:15:27.305109
82	882	阿润月饼/黄油渣馅	SP0000153	袋	0		0	0.00	2026-04-03 07:16:26.924053
124	869	青砖碎茶	SP0000166	件	0		0	0.00	2026-04-03 07:16:10.633555
69	932	炒米海丰	SP0000103	袋	0		0	0.00	2026-04-03 07:17:55.169648
66	903	盛宇燃奶豆腐/甜味	SP0000132	袋	0		0	0.00	2026-04-03 07:17:39.33442
120	918	黄油/半斤	SP0000117	瓶	0		0	0.00	2026-04-03 07:17:43.637751
130	883	阿润月饼/奶豆腐馅	SP0000152	袋	0		0	0.00	2026-04-03 07:16:26.932748
99	854	牛肉干/散/原味	SP0000181	斤	0		0	0.00	2026-04-03 07:15:35.848018
83	831	果条/阿润	SP0000205	袋	0		0	0.00	2026-04-03 07:15:24.63229
129	881	阿润月饼/奶皮子馅	SP0000154	袋	0		0	0.00	2026-04-03 07:16:26.915656
71	823	黄油/中瓶	SP0000213	瓶	0		0	0.00	2026-04-03 07:15:09.192995
128	884	实惠/奶豆腐	SP0000151	个	0		0	0.00	2026-04-03 07:16:39.181284
53	1032	专盒/冻炒米	SP0000002	捆	0		0	0.00	2026-04-03 07:19:44.874108
107	1011	茶包	SP0000023	件	0		0	0.00	2026-04-03 07:19:01.223423
62	811	蒙古果子/格日勒	SP0000225	袋	0		0	0.00	2026-04-03 07:15:03.513302
103	872	半成品/黄金纬度牛肉干/那牧尔	SP0000163	袋	0		0	0.00	2026-04-03 07:15:42.654474
58	857	厚奶皮	SP0000178	张	0		0	0.00	2026-04-03 07:15:43.998152
59	804	德吉酸奶/2斤装	SP0000232	瓶	0		0	0.00	2026-04-03 07:15:02.128198
67	904	盛宇燃奶豆腐/原味	SP0000131	袋	0		0	0.00	2026-04-03 07:17:39.342265
112	866	酸奶/纯净	SP0000169	瓶	0		0	0.00	2026-04-03 07:16:03.599597
113	865	牛肉干/和希格图	SP0000170	袋	0		0	0.00	2026-04-03 07:16:05.047212
132	945	半成品/透明/奶皮卷	SP0000090	盒	0		0	0.00	2026-04-03 07:17:57.974333
85	846	酸奶/额吉伊德	SP0000189	瓶	0		0	0.00	2026-04-03 07:15:27.314112
87	838	奶粉蒙古国	SP0000197	袋	0		0	0.00	2026-04-03 07:15:28.722534
88	839	奶皮子粉	SP0000196	袋	0		0	0.00	2026-04-03 07:15:28.730805
89	840	奶茶粉战粮	SP0000195	盒	0		0	0.00	2026-04-03 07:15:28.740066
90	841	奶茶粉贡格尔	SP0000194	袋	0		0	0.00	2026-04-03 07:15:28.74909
91	842	努德勒沁调和茶	SP0000193	袋	0		0	0.00	2026-04-03 07:15:28.757841
92	843	阿依古丽奶茶专用红茶	SP0000192	袋	0		0	0.00	2026-04-03 07:15:28.766199
95	836	礼盒/2026	SP0000199	个	0		0	0.00	2026-04-03 07:15:30.123871
56	922	酸奶炒米糖/散装	SP0000113	斤	0		0	0.00	2026-04-03 07:17:39.293094
75	825	故乡宝酸马奶	SP0000211	盒	0		0	0.00	2026-04-03 07:15:13.464364
93	844	希日嘎拉奶茶专用茶	SP0000191	盒	0		0	0.00	2026-04-03 07:15:28.790817
76	826	乌日汗酸奶	SP0000210	盒	0		0	0.00	2026-04-03 07:15:13.47303
100	851	晴王糖葫芦	SP0000184	盒	0		0	0.00	2026-04-03 07:15:37.19596
101	850	红糖袋/delicious	SP0000185	张	0		0	0.00	2026-04-03 07:15:38.606311
72	916	脆奶条/散装/科尔沁	SP0000119	斤	0		0	0.00	2026-04-03 07:17:39.309253
74	923	炒米/散装/硬口	SP0000112	麻袋	0		0	0.00	2026-04-03 07:17:36.242947
60	805	德吉酸奶/一斤装	SP0000231	瓶	0		0	0.00	2026-04-03 07:15:02.137939
64	856	科尔沁/大奶豆腐	SP0000179	张	0		0	0.00	2026-04-03 07:15:41.319141
55	921	嚼口脆炒米糖/散装	SP0000114	斤	0		0	0.00	2026-04-03 07:17:39.285081
116	940	半成品/透明/甜味/鲜奶酪	SP0000095	盒	0		0	0.00	2026-04-03 07:17:57.990526
77	901	手工白花炒米/散装	SP0000134	麻袋	0		0	0.00	2026-04-03 07:17:22.955496
105	859	糖/阿润	SP0000176	4030	0		0	0.00	2026-04-03 07:15:46.803417
106	858	糖葫芦	SP0000177	盒	0		0	0.00	2026-04-03 07:15:48.160925
111	991	奶果子/散装	SP0000043	斤	0		0	0.00	2026-04-03 07:19:14.802483
125	867	5g/青砖袋泡茶	SP0000168	件	0		0	0.00	2026-04-03 07:16:10.641773
126	868	16g青砖袋泡茶	SP0000167	件	0		0	0.00	2026-04-03 07:16:10.650383
127	878	羊奶粉/1斤	SP0000157	盒	0		0	0.00	2026-04-03 07:16:12.040914
52	902	乌日莫糖/散装	SP0000133	斤	0		0	0.00	2026-04-03 07:17:22.964001
115	939	半成品/透明/原味/鲜奶酪	SP0000096	盒	0		0	0.00	2026-04-03 07:17:57.982423
70	931	炒米粉/aag	SP0000104	袋	0		0	0.00	2026-04-03 07:17:55.161326
152	895	黄油渣月饼	SP0000140	小包	0		0	0.00	2026-04-03 07:17:03.066259
200	966	查嘎粉/小包装袋	SP0000068	小包	0		0	0.00	2026-04-03 07:18:12.546713
206	995	茶专用/热缩膜	SP0000039	捆	0		0	0.00	2026-04-03 07:19:07.714101
189	958	小/长方/亚克力/乳清奶条盒	SP0000077	盒	0		0	0.00	2026-04-03 07:18:08.07251
163	953	透专标签/奶酪/甜味	SP0000082	张	0		0	0.00	2026-04-03 07:18:09.553125
185	962	中/方形/亚克力盒/	SP0000072	盒	0		0	0.00	2026-04-03 07:18:08.036625
170	912	蓝旗绿乳糖水果	SP0000123	袋	0		0	0.00	2026-04-03 07:17:39.259927
187	961	扁盒/亚克力/带内托	SP0000074	盒	0		0	0.00	2026-04-03 07:18:08.056439
172	914	蓝旗绿乳糖炼乳	SP0000121	袋	0		0	0.00	2026-04-03 07:17:39.276967
155	894	酸奶月饼	SP0000141	小包	0		0	0.00	2026-04-03 07:17:03.092335
162	952	透专标签/奶酪/原味	SP0000083	张	0		0	0.00	2026-04-03 07:18:09.544832
149	891	芝士奶豆腐月饼	SP0000144	小包	0		0	0.00	2026-04-03 07:17:03.040359
142	973	精品/奶豆腐块儿/甜味/	SP0000061	袋	0		0	0.00	2026-04-03 07:18:06.604942
151	892	那牧尔酸奶	SP0000143	盒	0		0	0.00	2026-04-03 07:17:03.057842
140	889	奶皮卷/科尔沁	SP0000146	盒	0		0	0.00	2026-04-03 07:16:50.7254
153	896	奶皮月饼	SP0000139	小包	0		0	0.00	2026-04-03 07:17:03.074678
177	949	专袋/乌日莫/炒米	SP0000086	张	0		0	0.00	2026-04-03 07:17:52.150526
186	960	三角/奶皮千层盒	SP0000075	盒	0		0	0.00	2026-04-03 07:18:08.047858
144	886	冻炒米/科尔沁	SP0000149	盒	0		0	0.00	2026-04-03 07:16:50.73363
188	959	大/牛薄脆盒/亚克力	SP0000076	盒	0		0	0.00	2026-04-03 07:18:08.064571
205	1000	木勺	SP0000034	个	0		0	0.00	2026-04-03 07:19:04.669373
208	1019	标签/不干胶/冻炒米	SP0000015	张	0		0	0.00	2026-04-03 07:19:32.911437
160	950	透专标签/奶皮卷	SP0000085	张	0		0	0.00	2026-04-03 07:18:09.518021
165	1010	奶油球	SP0000024	件	0		0	0.00	2026-04-03 07:18:59.821067
146	888	河套奶粉	SP0000147	盒	0		0	0.00	2026-04-03 07:16:50.76148
158	915	黄油渣/盒	SP0000120	盒	0		0	0.00	2026-04-03 07:17:39.301458
173	905	真空奶豆腐砖/甜味	SP0000130	袋	0		0	0.00	2026-04-03 07:17:39.317379
166	929	白砂糖	SP0000106	袋	0		0	0.00	2026-04-03 07:17:56.551348
156	917	机器乌日末液体	SP0000118	斤	0		0	0.00	2026-04-03 07:17:43.61975
174	906	真空奶豆腐砖/原味	SP0000129	袋	0		0	0.00	2026-04-03 07:17:39.326017
176	873	专袋/牛肉干包装	SP0000162	袋	0		0	0.00	2026-04-03 07:17:42.211716
148	1015	散装/原味奶条	SP0000019	斤	0		0	0.00	2026-04-03 07:18:58.460184
175	924	冻炒米/袋装	SP0000111	袋	0		0	0.00	2026-04-03 07:17:43.611073
171	913	蓝旗绿乳糖黄油球	SP0000122	袋	0		0	0.00	2026-04-03 07:17:39.268544
207	1001	冷冻柜/冰箱	SP0000033	台	0		0	0.00	2026-04-03 07:18:30.959295
178	948	专袋/乌日莫	SP0000087	张	0		0	0.00	2026-04-03 07:17:52.158936
193	954	透专标签/乳清奶条/甜味	SP0000081	张	0		0	0.00	2026-04-03 07:18:09.561189
168	910	蓝旗绿乳糖奶香酥	SP0000125	袋	0		0	0.00	2026-04-03 07:17:39.243854
182	926	大奶豆腐砖/1.2斤	SP0000109	个	0		0	0.00	2026-04-03 07:17:57.941413
209	984	茶包/类腰封纸	SP0000050	3009	0		0	0.00	2026-04-03 07:18:35.237121
184	925	小/无印花/奶豆腐砖/1斤	SP0000110	个	0		0	0.00	2026-04-03 07:17:57.957918
204	1027	真空袋	SP0000007	张	0		0	0.00	2026-04-03 07:19:41.587885
169	911	蓝旗绿乳糖果仁酥	SP0000124	袋	0		0	0.00	2026-04-03 07:17:39.252011
164	956	透专标签/鲜奶皮	SP0000079	张	0		0	0.00	2026-04-03 07:18:09.57782
197	965	半成品/透明/冻炒米	SP0000069	盒	0		0	0.00	2026-04-03 07:18:12.504965
159	900	透专标签/脆香奶条/微甜	SP0000135	张	0		0	0.00	2026-04-03 07:17:27.327612
141	890	红枣	SP0000145	斤	0		0	0.00	2026-04-03 07:16:47.228043
161	951	透专标签/冻炒米	SP0000084	张	0		0	0.00	2026-04-03 07:18:09.535879
191	979	新茶包/纸	SP0000055	张	0		0	0.00	2026-04-03 07:18:09.501215
136	1024	标签/不干胶/奶条/甜味	SP0000010	张	0		0	0.00	2026-04-03 07:19:44.917115
181	928	塑料购物袋	SP0000107	袋	0		0	0.00	2026-04-03 07:17:56.569839
135	968	大/奶皮	SP0000066	张	0		0	0.00	2026-04-03 07:18:12.52178
145	887	羊乳奶粉/奶茶专用	SP0000148	盒	0		0	0.00	2026-04-03 07:16:50.743222
202	1016	专瓶/黄油	SP0000018	瓶	0		0	0.00	2026-04-03 07:19:43.482953
183	927	小奶豆腐砖/1斤	SP0000108	个	0		0	0.00	2026-04-03 07:17:57.949413
133	974	纯净黄油/瓶装好的	SP0000060	瓶	0		0	0.00	2026-04-03 07:18:06.623245
131	946	半成品/透明/鲜奶皮	SP0000089	盒	0		0	0.00	2026-04-03 07:17:57.966602
199	967	查嘎/乳清	SP0000067	桶	0		0	0.00	2026-04-03 07:18:12.53879
195	972	原味/散称/奶豆腐块儿	SP0000062	斤	0		0	0.00	2026-04-03 07:18:12.487422
192	1020	标签/不干胶/奶果子	SP0000014	张	0		0	0.00	2026-04-03 07:19:44.892633
194	955	透专标签/乳清奶条/原味	SP0000080	张	0		0	0.00	2026-04-03 07:18:09.569355
198	969	小/奶皮	SP0000065	张	0		0	0.00	2026-04-03 07:18:12.530477
157	1013	冻炒米/给组装半成品/那牧尔	SP0000021	盒	0		0	0.00	2026-04-03 07:18:55.588143
196	971	甜味/散称/奶豆腐块儿	SP0000063	斤	0		0	0.00	2026-04-03 07:18:12.496511
134	899	纯净/黄油/斤	SP0000136	瓶	0		0	0.00	2026-04-03 07:17:10.983678
167	909	蓝旗绿乳糖惠虹糖	SP0000126	袋	0		0	0.00	2026-04-03 07:17:39.236033
154	897	早餐包/那牧尔	SP0000138	袋	0		0	0.00	2026-04-03 07:17:03.08302
143	986	精品/奶豆腐块儿/原味	SP0000048	袋	0		0	0.00	2026-04-03 07:18:06.614019
137	898	透专标签/奶皮千层	SP0000137	张	0		0	0.00	2026-04-03 07:16:22.553266
147	1014	散装/甜味奶条	SP0000020	斤	0		0	0.00	2026-04-03 07:18:54.236914
203	862	专瓶/黄油渣	SP0000173	瓶	0		0	0.00	2026-04-03 07:18:19.527926
117	944	半成品/透明/奶皮千层	SP0000091	盒	0		0	0.00	2026-04-03 07:16:28.422361
150	893	奶豆腐月饼	SP0000142	小包	0		0	0.00	2026-04-03 07:17:03.049236
190	957	大/长方/亚克力/待用	SP0000078	盒	0		0	0.00	2026-04-03 07:18:08.080972
180	1002	封口机/真空	SP0000032	台	0		0	0.00	2026-04-03 07:18:29.444652
179	930	加沙奶豆腐	SP0000105	袋	0		0	0.00	2026-04-03 07:17:55.153355
201	982	塑料手提袋	SP0000052	个	0		0	0.00	2026-04-03 07:18:18.131413
210	975	黄油脖签	SP0000059	张	0		0	0.00	2026-04-03 07:18:35.245056
211	978	新茶专用标签纸	SP0000056	张	0		0	0.00	2026-04-03 07:18:35.253614
213	989	蒙古黄油/瓶装成品	SP0000045	瓶	0		0	0.00	2026-04-03 07:18:40.998836
214	988	原味传统奶豆腐/成品袋装	SP0000046	袋	0		0	0.00	2026-04-03 07:18:41.007928
215	987	采购样品专用/乳制品	SP0000047	斤	0		0	0.00	2026-04-03 07:18:47.110814
216	1003	热收缩膜机	SP0000031	台	0		0	0.00	2026-04-03 07:18:48.628821
217	1009	专盒/青砖奶茶外盒	SP0000025	张	0		0	0.00	2026-04-03 07:19:09.132499
139	1021	原味/标签/不干胶/传统奶豆腐	SP0000013	张	0		0	0.00	2026-04-03 07:19:38.74281
227	1022	专袋/传统奶豆腐	SP0000012	张	0		0	0.00	2026-04-03 07:19:40.201753
226	1023	标签/不干胶/奶条/原味	SP0000011	张	0		0	0.00	2026-04-03 07:19:44.882932
223	1028	专标签/黄油	SP0000006	张	0		0	0.00	2026-04-03 07:19:44.908719
96	855	奶锅巴/扎旗吉十奶制品	SP0000180	散	0		0	0.00	2026-04-03 07:15:34.433569
138	983	甜味/标签/不干胶/传统奶豆腐	SP0000051	张	0		0	0.00	2026-04-03 07:18:36.703432
218	998	茶专用/硫酸纸	SP0000036	张	0		0	0.00	2026-04-03 07:19:06.2493
212	999	茶专用/不干胶/标签	SP0000035	张	0		0	0.00	2026-04-03 07:19:06.257698
219	990	奶果子/专用塑膜袋	SP0000044	袋	0		0	0.00	2026-04-03 07:19:13.40261
225	1025	定制款/专内袋/扎那家奶果子	SP0000009	捆	0		0	0.00	2026-04-03 07:19:25.927766
228	1018	礼盒/蓝界	SP0000016	张	0		0	0.00	2026-04-03 07:19:34.355358
229	1017	手提袋	SP0000017	张	0		0	0.00	2026-04-03 07:19:35.722565
220	1031	专底盒/奶条	SP0000003	张	0		0	0.00	2026-04-03 07:19:37.275823
222	1030	专外盒/奶果子	SP0000004	捆	0		0	0.00	2026-04-03 07:19:37.292965
221	1029	专内盒/奶果子	SP0000005	捆	0		0	0.00	2026-04-03 07:19:37.309964
224	1026	专内袋/奶果子	SP0000008	捆	0		0	0.00	2026-04-03 07:19:37.326633
\.


--
-- Data for Name: stock_other_in; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_other_in (id, order_no, warehouse_id, warehouse_name, goods_info, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: stock_other_out; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_other_out (id, order_no, warehouse_id, warehouse_name, goods_info, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: supplier; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.supplier (id, name, contact, mobile, email, address, bank, bank_account, remark, status, create_time, update_time, deleted_at) FROM stdin;
73	测试供应商_验证序列	测试							1	2026-03-29 16:43:10.24851	2026-03-29 16:43:10.24851	2026-03-29 16:43:11.932854
0	纯净	1							1	2026-03-29 15:42:32.952504	2026-03-29 15:42:32.952504	2026-03-30 15:18:52.989696
74	德吉奶食品								1	2026-03-30 15:22:07.005923	2026-03-30 15:22:07.005923	\N
75	格日勒								1	2026-03-30 15:22:07.576614	2026-03-30 15:22:07.576614	\N
76	乌日汗奶食品店								1	2026-03-30 15:22:08.063614	2026-03-30 15:22:08.063614	\N
77	道力干记录付款单/选择应用								1	2026-03-30 15:22:08.827363	2026-03-30 15:22:08.827363	\N
78	小米厂家阿旗								1	2026-03-30 15:22:09.32747	2026-03-30 15:22:09.32747	\N
79	沈阳包装								1	2026-03-30 15:22:09.772668	2026-03-30 15:22:09.772668	\N
80	奥特尔奶食品店								1	2026-03-30 15:22:10.57362	2026-03-30 15:22:10.57362	\N
81	额吉伊德								1	2026-03-30 15:22:11.036034	2026-03-30 15:22:11.036034	\N
82	阿齐图/巴林右旗								1	2026-03-30 15:22:11.50628	2026-03-30 15:22:11.50628	\N
83	扎旗吉十奶制品								1	2026-03-30 15:22:11.950654	2026-03-30 15:22:11.950654	\N
84	兴安盟杭盖奶制品厂								1	2026-03-30 15:22:12.433738	2026-03-30 15:22:12.433738	\N
85	糖炮								1	2026-03-30 15:22:12.90166	2026-03-30 15:22:12.90166	\N
86	雷记炒货								1	2026-03-30 15:22:13.35404	2026-03-30 15:22:13.35404	\N
87	天山民族印刷厂								1	2026-03-30 15:22:14.167515	2026-03-30 15:22:14.167515	\N
88	茁硕乐/牛肉干								1	2026-03-30 15:22:14.626947	2026-03-30 15:22:14.626947	\N
89	线上/推广/								1	2026-03-30 15:22:15.115137	2026-03-30 15:22:15.115137	\N
90	阿润查干								1	2026-03-30 15:22:15.529263	2026-03-30 15:22:15.529263	\N
91	汇鑫物流								1	2026-03-30 15:22:16.367735	2026-03-30 15:22:16.367735	\N
92	奥都奶食品								1	2026-03-30 15:22:16.79681	2026-03-30 15:22:16.79681	\N
93	杂/采购商								1	2026-03-30 15:22:17.281919	2026-03-30 15:22:17.281919	\N
94	杂物费								1	2026-03-30 15:22:17.763095	2026-03-30 15:22:17.763095	\N
95	收费站点								1	2026-03-30 15:22:18.229219	2026-03-30 15:22:18.229219	\N
96	浙江金矿包装								1	2026-03-30 15:22:18.697499	2026-03-30 15:22:18.697499	\N
97	纯净奶食品								1	2026-03-30 15:22:19.120004	2026-03-30 15:22:19.120004	\N
98	科尔沁奶食品								1	2026-03-30 15:22:19.592233	2026-03-30 15:22:19.592233	\N
99	淘宝/杂								1	2026-03-30 15:22:20.042539	2026-03-30 15:22:20.042539	\N
100	民族印刷厂								1	2026-03-30 15:22:20.491162	2026-03-30 15:22:20.491162	\N
101	拼多多/随机店采购								1	2026-03-30 15:22:20.960891	2026-03-30 15:22:20.960891	\N
102	泰成物流								1	2026-03-30 15:22:21.378969	2026-03-30 15:22:21.378969	\N
103	圆通快递								1	2026-03-30 15:22:21.861315	2026-03-30 15:22:21.861315	\N
104	锡盟艾润萨利SC								1	2026-03-30 15:22:22.340425	2026-03-30 15:22:22.340425	\N
105	翁牛特旗奶果子								1	2026-03-30 15:22:22.781489	2026-03-30 15:22:22.781489	\N
106	拼多多/热缩膜								1	2026-03-30 15:22:23.261287	2026-03-30 15:22:23.261287	\N
107	拼多多/木勺								1	2026-03-30 15:22:23.702022	2026-03-30 15:22:23.702022	\N
108	山东锦食食品								1	2026-03-30 15:22:24.19871	2026-03-30 15:22:24.19871	\N
109	拼多多/雪诗希电器专营店								1	2026-03-30 15:22:24.681142	2026-03-30 15:22:24.681142	\N
110	淘宝欧信								1	2026-03-30 15:22:25.119963	2026-03-30 15:22:25.119963	\N
111	优如包装								1	2026-03-30 15:22:25.596428	2026-03-30 15:22:25.596428	\N
112	广州维记								1	2026-03-30 15:22:26.024076	2026-03-30 15:22:26.024076	\N
113	永巨茶业								1	2026-03-30 15:22:26.489032	2026-03-30 15:22:26.489032	\N
114	阿旗北方								1	2026-03-30 15:22:26.953119	2026-03-30 15:22:26.953119	\N
115	那牧尔乳制品厂/纯净之源								1	2026-03-30 15:22:27.38196	2026-03-30 15:22:27.38196	\N
116	恩赫奶制品厂								1	2026-03-30 15:22:27.859423	2026-03-30 15:22:27.859423	\N
117	巴音珠萨朗								1	2026-03-30 15:22:28.295097	2026-03-30 15:22:28.295097	\N
118	淘宝/江苏永发玻璃制品厂								1	2026-03-30 15:22:28.744133	2026-03-30 15:22:28.744133	\N
119	沈阳乾兴包装								1	2026-03-30 15:22:29.222816	2026-03-30 15:22:29.222816	\N
120	淘宝紫辰包装								1	2026-03-30 15:22:29.64747	2026-03-30 15:22:29.64747	\N
121	盛大印刷								1	2026-03-30 15:22:30.15674	2026-03-30 15:22:30.15674	\N
122	沈阳东源包材厂								1	2026-03-30 15:22:30.605721	2026-03-30 15:22:30.605721	\N
123	银河包装								1	2026-03-30 15:22:31.047879	2026-03-30 15:22:31.047879	\N
\.


--
-- Data for Name: sys_params; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sys_params (id, key, value, remark) FROM stdin;
\.


--
-- Data for Name: warehouses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.warehouses (id, name, address, remark, status, create_time) FROM stdin;
1	默认仓库			1	2026-03-28 12:40:01.297668
2	默认仓库			1	2026-03-28 13:04:00.311975
3	默认仓库			1	2026-03-28 15:27:33.970328
4	默认仓库			1	2026-03-28 15:55:43.449274
5	默认仓库			1	2026-03-28 16:38:38.690211
6	默认仓库			1	2026-03-28 16:44:50.600007
7	默认仓库			1	2026-03-28 17:11:35.050357
8	默认仓库			1	2026-03-28 17:22:12.560913
9	默认仓库			1	2026-03-28 22:07:54.762114
10	默认仓库			1	2026-03-29 05:06:32.176456
11	默认仓库			1	2026-03-29 05:18:24.494693
12	默认仓库			1	2026-03-29 05:38:36.485287
13	默认仓库			1	2026-03-29 05:45:52.801868
14	默认仓库			1	2026-03-29 05:55:11.677437
15	默认仓库			1	2026-03-29 06:42:11.610646
16	默认仓库			1	2026-03-29 07:23:22.393738
17	默认仓库			1	2026-03-29 07:56:04.766849
18	默认仓库			1	2026-03-29 08:03:45.6008
19	默认仓库			1	2026-03-29 08:22:52.402644
20	默认仓库			1	2026-03-29 10:00:07.834443
21	默认仓库			1	2026-03-29 10:32:12.209891
22	默认仓库			1	2026-03-29 11:22:04.999934
23	默认仓库			1	2026-03-29 11:46:33.972221
24	默认仓库			1	2026-03-29 12:49:05.812735
25	默认仓库			1	2026-03-29 13:31:35.325303
26	默认仓库			1	2026-03-29 13:59:29.671422
27	默认仓库			1	2026-03-29 15:02:42.012659
28	默认仓库			1	2026-03-29 15:35:46.471511
29	默认仓库			1	2026-03-29 16:43:02.133764
30	默认仓库			1	2026-03-29 16:58:30.061243
31	默认仓库			1	2026-03-29 17:41:56.45484
32	默认仓库			1	2026-03-29 18:04:48.644347
33	默认仓库			1	2026-03-29 19:04:42.010642
34	默认仓库			1	2026-03-29 19:47:24.402298
35	默认仓库			1	2026-03-29 20:18:06.49146
36	默认仓库			1	2026-03-29 20:56:30.431488
37	默认仓库			1	2026-03-29 21:31:38.70648
38	默认仓库			1	2026-03-29 21:59:47.353696
39	默认仓库			1	2026-03-29 22:41:34.046379
40	默认仓库			1	2026-03-29 23:05:44.36943
41	默认仓库			1	2026-03-29 23:47:50.172766
42	默认仓库			1	2026-03-30 01:07:52.397815
43	默认仓库			1	2026-03-30 04:17:25.282348
44	默认仓库			1	2026-03-30 06:14:12.941402
45	默认仓库			1	2026-03-30 08:04:55.274894
46	默认仓库			1	2026-03-30 09:48:27.033787
47	默认仓库			1	2026-03-30 10:52:29.356817
48	默认仓库			1	2026-03-30 11:40:58.872937
49	默认仓库			1	2026-03-30 12:45:57.531323
50	默认仓库			1	2026-03-30 14:18:29.232505
51	默认仓库			1	2026-03-30 14:53:15.73551
52	默认仓库			1	2026-03-30 15:08:37.24085
53	默认仓库			1	2026-03-30 15:29:57.923707
54	默认仓库			1	2026-03-30 15:49:07.845618
55	默认仓库			1	2026-03-30 16:10:45.632245
56	默认仓库			1	2026-03-30 16:46:05.840405
57	默认仓库			1	2026-03-30 18:39:42.589488
58	默认仓库			1	2026-03-30 19:41:10.627891
59	默认仓库			1	2026-03-30 20:27:02.439223
60	默认仓库			1	2026-03-30 21:08:56.97065
61	默认仓库			1	2026-03-30 21:57:35.506089
62	默认仓库			1	2026-03-30 22:40:39.649628
63	默认仓库			1	2026-03-30 22:57:57.120503
64	默认仓库			1	2026-03-30 23:21:10.651132
65	默认仓库			1	2026-03-30 23:36:50.980849
66	默认仓库			1	2026-03-30 23:56:43.103404
67	默认仓库			1	2026-03-31 00:58:14.348764
68	默认仓库			1	2026-03-31 03:49:02.14659
69	默认仓库			1	2026-03-31 04:16:06.117794
70	默认仓库			1	2026-03-31 05:00:10.706492
71	默认仓库			1	2026-03-31 05:16:13.304715
72	默认仓库			1	2026-03-31 06:04:01.420123
73	默认仓库			1	2026-03-31 06:07:22.54774
74	默认仓库			1	2026-03-31 07:49:35.593015
75	默认仓库			1	2026-03-31 08:43:55.177843
76	默认仓库			1	2026-03-31 09:51:52.828738
77	默认仓库			1	2026-03-31 10:42:14.154063
78	默认仓库			1	2026-03-31 11:36:30.190286
79	默认仓库			1	2026-03-31 12:05:47.252334
80	默认仓库			1	2026-03-31 13:08:59.799614
81	默认仓库			1	2026-03-31 13:32:13.814685
82	默认仓库			1	2026-03-31 14:14:15.095487
83	默认仓库			1	2026-03-31 15:04:35.354578
84	默认仓库			1	2026-03-31 15:23:13.534498
85	默认仓库			1	2026-03-31 16:22:04.130127
86	默认仓库			1	2026-03-31 16:25:19.505615
87	默认仓库			1	2026-03-31 17:10:52.094918
88	默认仓库			1	2026-03-31 18:37:04.548393
89	默认仓库			1	2026-03-31 19:39:30.778861
90	默认仓库			1	2026-03-31 20:24:57.430796
91	默认仓库			1	2026-03-31 21:02:59.145467
92	默认仓库			1	2026-03-31 21:55:14.399858
93	默认仓库			1	2026-03-31 22:31:49.974893
94	默认仓库			1	2026-03-31 23:04:29.062246
95	默认仓库			1	2026-03-31 23:49:01.703213
96	默认仓库			1	2026-04-01 01:11:55.32632
97	默认仓库			1	2026-04-01 01:29:34.225835
98	默认仓库			1	2026-04-01 01:36:40.784045
99	默认仓库			1	2026-04-01 04:22:40.560754
100	默认仓库			1	2026-04-01 06:09:59.684795
101	默认仓库			1	2026-04-01 07:54:03.438887
102	默认仓库			1	2026-04-01 08:56:43.47246
103	默认仓库			1	2026-04-01 10:08:27.239874
104	默认仓库			1	2026-04-01 11:13:42.58566
105	默认仓库			1	2026-04-01 11:41:11.508785
106	默认仓库			1	2026-04-01 12:03:27.327237
107	默认仓库			1	2026-04-01 12:47:36.935657
108	默认仓库			1	2026-04-01 13:54:36.266707
109	默认仓库			1	2026-04-01 13:56:20.983838
110	默认仓库			1	2026-04-01 14:18:39.605943
111	默认仓库			1	2026-04-01 15:02:34.155311
112	默认仓库			1	2026-04-01 15:31:56.179845
113	默认仓库			1	2026-04-01 17:34:41.934792
114	默认仓库			1	2026-04-01 18:37:15.382982
115	默认仓库			1	2026-04-01 19:43:38.639136
116	默认仓库			1	2026-04-01 20:32:23.496441
117	默认仓库			1	2026-04-01 21:27:04.515148
118	默认仓库			1	2026-04-01 22:04:32.373066
119	默认仓库			1	2026-04-01 22:57:49.430066
120	默认仓库			1	2026-04-01 23:40:01.955967
121	默认仓库			1	2026-04-02 00:04:04.214015
122	默认仓库			1	2026-04-02 02:25:56.158032
123	默认仓库			1	2026-04-02 02:49:38.921491
124	默认仓库			1	2026-04-02 03:57:38.490625
125	默认仓库			1	2026-04-02 04:35:40.61316
126	默认仓库			1	2026-04-02 06:29:13.883152
127	默认仓库			1	2026-04-02 07:56:09.387912
128	默认仓库			1	2026-04-02 08:41:22.63032
129	默认仓库			1	2026-04-02 09:51:02.645407
130	默认仓库			1	2026-04-02 10:39:06.787064
131	默认仓库			1	2026-04-02 11:09:41.474392
132	默认仓库			1	2026-04-02 11:57:25.550236
133	默认仓库			1	2026-04-02 13:21:05.484034
134	默认仓库			1	2026-04-02 14:09:33.797842
135	默认仓库			1	2026-04-02 14:38:03.772104
136	默认仓库			1	2026-04-02 15:40:03.941177
137	默认仓库			1	2026-04-02 16:06:28.294881
138	默认仓库			1	2026-04-02 16:36:57.735072
139	默认仓库			1	2026-04-02 18:34:07.109718
140	默认仓库			1	2026-04-02 19:34:51.57976
141	默认仓库			1	2026-04-02 20:07:38.976708
142	默认仓库			1	2026-04-02 20:54:07.855969
143	默认仓库			1	2026-04-02 21:31:45.750091
144	默认仓库			1	2026-04-02 22:06:35.352223
145	默认仓库			1	2026-04-02 22:51:36.973535
146	默认仓库			1	2026-04-02 23:22:09.968854
147	默认仓库			1	2026-04-02 23:56:58.370721
148	默认仓库			1	2026-04-03 02:26:41.055448
149	默认仓库			1	2026-04-03 03:50:55.38495
150	默认仓库			1	2026-04-03 04:42:22.056291
151	默认仓库			1	2026-04-03 05:01:22.051476
152	默认仓库			1	2026-04-03 05:24:01.139788
153	默认仓库			1	2026-04-03 06:06:51.801331
154	默认仓库			1	2026-04-03 06:37:17.014925
155	默认仓库			1	2026-04-03 08:17:04.298645
156	默认仓库			1	2026-04-03 09:24:44.002653
157	默认仓库			1	2026-04-03 09:52:13.14488
158	默认仓库			1	2026-04-03 09:54:41.464641
159	默认仓库			1	2026-04-03 10:02:31.808199
160	默认仓库			1	2026-04-03 10:26:30.287289
161	默认仓库			1	2026-04-03 10:37:36.457107
162	默认仓库			1	2026-04-03 10:39:28.801066
163	默认仓库			1	2026-04-03 10:48:03.55364
164	默认仓库			1	2026-04-03 11:04:39.656224
165	默认仓库			1	2026-04-03 11:42:02.285427
166	默认仓库			1	2026-04-03 11:48:14.072809
167	默认仓库			1	2026-04-03 12:05:07.459664
168	默认仓库			1	2026-04-03 13:49:52.246041
169	默认仓库			1	2026-04-03 14:26:19.32411
170	默认仓库			1	2026-04-03 15:16:29.72109
171	默认仓库			1	2026-04-03 16:00:13.974697
172	默认仓库			1	2026-04-03 16:27:43.887238
173	默认仓库			1	2026-04-03 17:00:59.637716
174	默认仓库			1	2026-04-03 17:44:38.102507
175	默认仓库			1	2026-04-03 18:30:32.979625
\.


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.admins_id_seq', 247, true);


--
-- Name: bom_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.bom_items_id_seq', 88, true);


--
-- Name: bom_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.bom_order_id_seq', 22, true);


--
-- Name: collect_receipt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.collect_receipt_id_seq', 25, true);


--
-- Name: company_info_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.company_info_id_seq', 1, true);


--
-- Name: depts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.depts_id_seq', 50, true);


--
-- Name: finance_costs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_costs_id_seq', 50, true);


--
-- Name: finance_expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_expenses_id_seq', 50, true);


--
-- Name: finance_funds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_funds_id_seq', 57, true);


--
-- Name: finance_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_invoices_id_seq', 50, true);


--
-- Name: finance_payable_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_payable_id_seq', 50, true);


--
-- Name: finance_receivable_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_receivable_id_seq', 50, true);


--
-- Name: finance_statements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_statements_id_seq', 50, true);


--
-- Name: goods_brand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_brand_id_seq', 50, true);


--
-- Name: goods_cate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_cate_id_seq', 420, true);


--
-- Name: goods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_id_seq', 3081, true);


--
-- Name: goods_spec_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_spec_id_seq', 200, true);


--
-- Name: goods_unit_convert_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_unit_convert_id_seq', 66, true);


--
-- Name: goods_unit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_unit_id_seq', 51, true);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.jobs_id_seq', 50, true);


--
-- Name: operation_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.operation_logs_id_seq', 1000, true);


--
-- Name: pay_receipt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pay_receipt_id_seq', 298, true);


--
-- Name: prepay_record_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.prepay_record_id_seq', 50, true);


--
-- Name: procure_inhouse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.procure_inhouse_id_seq', 252, true);


--
-- Name: procure_plan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.procure_plan_id_seq', 50, true);


--
-- Name: procure_return_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.procure_return_id_seq', 50, true);


--
-- Name: purchase_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.purchase_order_id_seq', 502, true);


--
-- Name: retail_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.retail_members_id_seq', 10, true);


--
-- Name: retail_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.retail_orders_id_seq', 22, true);


--
-- Name: retail_recharge_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.retail_recharge_id_seq', 20, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.roles_id_seq', 10, true);


--
-- Name: sale_contracts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_contracts_id_seq', 179, true);


--
-- Name: sale_customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_customers_id_seq', 56, true);


--
-- Name: sale_offers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_offers_id_seq', 50, true);


--
-- Name: sale_out_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_out_order_id_seq', 100, true);


--
-- Name: sale_return_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_return_order_id_seq', 50, true);


--
-- Name: staff_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.staff_id_seq', 20, true);


--
-- Name: stock_checks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_checks_id_seq', 50, true);


--
-- Name: stock_flow_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_flow_id_seq', 2064, true);


--
-- Name: stock_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_inventory_id_seq', 229, true);


--
-- Name: stock_other_in_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_other_in_id_seq', 50, true);


--
-- Name: stock_other_out_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_other_out_id_seq', 50, true);


--
-- Name: supplier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.supplier_id_seq', 123, true);


--
-- Name: sys_params_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sys_params_id_seq', 50, true);


--
-- Name: warehouses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.warehouses_id_seq', 175, true);


--
-- Name: admins admins_account_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_account_key UNIQUE (account);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: bom_items bom_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bom_items
    ADD CONSTRAINT bom_items_pkey PRIMARY KEY (id);


--
-- Name: bom_order bom_order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bom_order
    ADD CONSTRAINT bom_order_pkey PRIMARY KEY (id);


--
-- Name: collect_receipt collect_receipt_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.collect_receipt
    ADD CONSTRAINT collect_receipt_pkey PRIMARY KEY (id);


--
-- Name: company_info company_info_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_info
    ADD CONSTRAINT company_info_pkey PRIMARY KEY (id);


--
-- Name: depts depts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.depts
    ADD CONSTRAINT depts_pkey PRIMARY KEY (id);


--
-- Name: finance_costs finance_costs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_costs
    ADD CONSTRAINT finance_costs_pkey PRIMARY KEY (id);


--
-- Name: finance_expenses finance_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_expenses
    ADD CONSTRAINT finance_expenses_pkey PRIMARY KEY (id);


--
-- Name: finance_funds finance_funds_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_funds
    ADD CONSTRAINT finance_funds_pkey PRIMARY KEY (id);


--
-- Name: finance_invoices finance_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_invoices
    ADD CONSTRAINT finance_invoices_pkey PRIMARY KEY (id);


--
-- Name: finance_payable finance_payable_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_payable
    ADD CONSTRAINT finance_payable_pkey PRIMARY KEY (id);


--
-- Name: finance_receivable finance_receivable_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_receivable
    ADD CONSTRAINT finance_receivable_pkey PRIMARY KEY (id);


--
-- Name: finance_statements finance_statements_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_statements
    ADD CONSTRAINT finance_statements_pkey PRIMARY KEY (id);


--
-- Name: goods_brand goods_brand_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_brand
    ADD CONSTRAINT goods_brand_pkey PRIMARY KEY (id);


--
-- Name: goods_cate goods_cate_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_cate
    ADD CONSTRAINT goods_cate_pkey PRIMARY KEY (id);


--
-- Name: goods goods_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods
    ADD CONSTRAINT goods_pkey PRIMARY KEY (id);


--
-- Name: goods_spec goods_spec_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_spec
    ADD CONSTRAINT goods_spec_pkey PRIMARY KEY (id);


--
-- Name: goods_unit_convert goods_unit_convert_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_unit_convert
    ADD CONSTRAINT goods_unit_convert_pkey PRIMARY KEY (id);


--
-- Name: goods_unit goods_unit_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_unit
    ADD CONSTRAINT goods_unit_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: operation_logs operation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.operation_logs
    ADD CONSTRAINT operation_logs_pkey PRIMARY KEY (id);


--
-- Name: pay_receipt pay_receipt_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pay_receipt
    ADD CONSTRAINT pay_receipt_pkey PRIMARY KEY (id);


--
-- Name: prepay_record prepay_record_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.prepay_record
    ADD CONSTRAINT prepay_record_pkey PRIMARY KEY (id);


--
-- Name: procure_inhouse procure_inhouse_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_inhouse
    ADD CONSTRAINT procure_inhouse_pkey PRIMARY KEY (id);


--
-- Name: procure_plan procure_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_plan
    ADD CONSTRAINT procure_plan_pkey PRIMARY KEY (id);


--
-- Name: procure_return procure_return_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_return
    ADD CONSTRAINT procure_return_pkey PRIMARY KEY (id);


--
-- Name: purchase_order purchase_order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_order
    ADD CONSTRAINT purchase_order_pkey PRIMARY KEY (id);


--
-- Name: retail_members retail_members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_members
    ADD CONSTRAINT retail_members_pkey PRIMARY KEY (id);


--
-- Name: retail_orders retail_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_orders
    ADD CONSTRAINT retail_orders_pkey PRIMARY KEY (id);


--
-- Name: retail_recharge retail_recharge_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_recharge
    ADD CONSTRAINT retail_recharge_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sale_contracts sale_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_contracts
    ADD CONSTRAINT sale_contracts_pkey PRIMARY KEY (id);


--
-- Name: sale_customers sale_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_customers
    ADD CONSTRAINT sale_customers_pkey PRIMARY KEY (id);


--
-- Name: sale_offers sale_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_offers
    ADD CONSTRAINT sale_offers_pkey PRIMARY KEY (id);


--
-- Name: sale_out_order sale_out_order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_out_order
    ADD CONSTRAINT sale_out_order_pkey PRIMARY KEY (id);


--
-- Name: sale_return_order sale_return_order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_return_order
    ADD CONSTRAINT sale_return_order_pkey PRIMARY KEY (id);


--
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- Name: stock_checks stock_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_checks
    ADD CONSTRAINT stock_checks_pkey PRIMARY KEY (id);


--
-- Name: stock_flow stock_flow_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_flow
    ADD CONSTRAINT stock_flow_pkey PRIMARY KEY (id);


--
-- Name: stock_inventory stock_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_inventory
    ADD CONSTRAINT stock_inventory_pkey PRIMARY KEY (id);


--
-- Name: stock_other_in stock_other_in_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_other_in
    ADD CONSTRAINT stock_other_in_pkey PRIMARY KEY (id);


--
-- Name: stock_other_out stock_other_out_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_other_out
    ADD CONSTRAINT stock_other_out_pkey PRIMARY KEY (id);


--
-- Name: supplier supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.supplier
    ADD CONSTRAINT supplier_pkey PRIMARY KEY (id);


--
-- Name: sys_params sys_params_key_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sys_params
    ADD CONSTRAINT sys_params_key_key UNIQUE (key);


--
-- Name: sys_params sys_params_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sys_params
    ADD CONSTRAINT sys_params_pkey PRIMARY KEY (id);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict ENRH8Nsed0l2KHQYiLkH9gLy8KJfjgsSgfFF575ptPZAdAxAJPX41PMill5ciYc

